import asyncio
import json
import logging
import os
import shutil
import subprocess  # nosec B404
import tempfile
import hashlib
from typing import Any, Dict, List, Optional, Tuple

from services.mcp_registry import get_integration_by_alias

log = logging.getLogger(__name__)

class McpSubprocessManager:
    """
    Manages long-running MCP subprocesses communicating over standard stdio streams (stdin/stdout).
    Uses robust synchronous Popen wrapped in asyncio.to_thread to completely bypass Windows event loop incompatibility (NotImplementedError).
    """
    def __init__(self):
        self._processes: Dict[str, subprocess.Popen] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._initialized: set = set()  # Track which connection_ids have been initialized

    def _get_lock(self, connection_id: str) -> asyncio.Lock:
        if connection_id not in self._locks:
            self._locks[connection_id] = asyncio.Lock()
        return self._locks[connection_id]

    def parse_runtime_command(self, runtime_url: str, auth_token: str) -> Tuple[List[str], Dict[str, str]]:
        """
        Parses runtime URLs like:
          - npx:@modelcontextprotocol/server-github
          - docker:mcp/github:latest
          - python:mcp_server_sqlite
        Returns (command_list, env_dict).
        """
        env = os.environ.copy()
        
        parts = runtime_url.split(":", 1)
        scheme = parts[0].lower()
        package = parts[1] if len(parts) > 1 else ""
        
        if auth_token:
            token_hash = hashlib.sha256(auth_token.encode("utf-8")).hexdigest()

            url_lower = runtime_url.lower()
            
            # Universal token environment variables
            env["AUTH_TOKEN"] = auth_token
            env["MCP_ACCESS_TOKEN"] = auth_token
            env["API_KEY"] = auth_token
            env["TOKEN"] = auth_token

            # Resolve matched provider dynamically
            matched = get_integration_by_alias(url_lower)
            if matched:
                # Inject provider-specific environment variables dynamically
                for var_name in matched.get("env_var_names", []):
                    env[var_name] = auth_token
                
                # Check for dynamic temp JSON credentials file creation
                temp_json_cfg = matched.get("temp_json_file")
                if temp_json_cfg:
                    try:
                        filename = f"{temp_json_cfg['filename_prefix']}{token_hash}.json"
                        temp_cred_path = os.path.join(tempfile.gettempdir(), filename)
                        
                        # Populate template dynamically by replacing "{auth_token}"
                        template_data = temp_json_cfg["template"].copy()
                        for k, v in template_data.items():
                            if isinstance(v, str) and v == "{auth_token}":
                                template_data[k] = auth_token
                                
                        with open(temp_cred_path, "w", encoding="utf-8") as f:
                            json.dump(template_data, f)
                            
                        for env_var in temp_json_cfg.get("env_vars", []):
                            env[env_var] = temp_cred_path
                    except Exception as e:
                        log.error(f"Failed to create dynamic temp credentials file for {matched.get('provider_name')}: {e}")

        if scheme == "docker":
            docker_cmd = shutil.which("docker") or "docker"
            cmd = [docker_cmd, "run", "-i", "--rm"]
            for k, v in env.items():
                cmd.extend(["-e", f"{k}={v}"])
            cmd.append(package)
            return cmd, env
        elif scheme == "npx":
            npx_cmd = shutil.which("npx") or ("npx.cmd" if os.name == "nt" else "npx")
            cmd = [npx_cmd, "-y", package]
            return cmd, env
        elif scheme == "python":
            py_cmd = shutil.which("python") or "python"
            cmd = [py_cmd, "-m", package]
            return cmd, env

        raise ValueError(f"Unsupported MCP subprocess scheme: {scheme}")

    def _sync_spawn(self, connection_id: str, cmd: List[str], env: Dict[str, str]) -> subprocess.Popen:
        if connection_id in self._processes:
            proc = self._processes[connection_id]
            if proc.poll() is None:
                return proc
            else:
                log.warning(f"MCP subprocess {connection_id} terminated with code {proc.returncode}. Respawning...")
                self._processes.pop(connection_id, None)
                self._initialized.discard(connection_id)

        # Redact the massive JSON string from logs to protect tokens
        log_cmd = [c if not (c.startswith('{') and 'token' in c.lower()) else '[REDACTED_CONFIG_JSON]' for c in cmd]
        log.info(f"Spawning MCP Popen Subprocess [{connection_id}]: {' '.join(log_cmd)}")
        
        proc = subprocess.Popen(  # nosec B603
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            bufsize=1, # Line buffered
            encoding="utf-8",
            errors="ignore"
        )
        self._processes[connection_id] = proc
        return proc

    def _sync_send_rpc(self, proc: subprocess.Popen, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not proc.stdin or not proc.stdout:
            raise RuntimeError("Subprocess pipes not initialized.")

        payload = {"jsonrpc": "2.0", "id": 1, "method": method}
        if params is not None:
            payload["params"] = params

        raw_req = json.dumps(payload) + "\n"
        proc.stdin.write(raw_req)
        proc.stdin.flush()

        while True:
            line_str = proc.stdout.readline()
            if not line_str:
                err_str = proc.stderr.read() if proc.stderr else ""
                raise RuntimeError(f"MCP Popen Subprocess closed standard output. Stderr: {err_str}")

            line_str = line_str.strip()
            if not line_str:
                continue

            try:
                data = json.loads(line_str)
                if isinstance(data, dict) and data.get("jsonrpc") == "2.0":
                    return data
            except json.JSONDecodeError:
                log.debug(f"MCP Subprocess Debug Output: {line_str}")

    async def get_or_spawn_process(self, connection_id: str, runtime_url: str, auth_token: str) -> subprocess.Popen:
        lock = self._get_lock(connection_id)
        async with lock:
            cmd, env = self.parse_runtime_command(runtime_url, auth_token)
            proc = await asyncio.to_thread(self._sync_spawn, connection_id, cmd, env)

            # Perform MCP initialize handshake once per process lifecycle
            if connection_id not in self._initialized:
                try:
                    await asyncio.wait_for(
                        asyncio.to_thread(self._sync_send_rpc, proc, "initialize", {
                            "protocolVersion": "2024-11-05",
                            "capabilities": {},
                            "clientInfo": {"name": "beaver", "version": "1.0.0"}
                        }),
                        timeout=30.0
                    )
                    # Send the required initialized notification (no response expected)
                    notif = json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n"
                    if proc.stdin:
                        proc.stdin.write(notif)
                        proc.stdin.flush()
                    self._initialized.add(connection_id)
                    log.info(f"MCP process [{connection_id}] initialized successfully.")
                except Exception as init_err:
                    log.warning(f"MCP initialize handshake failed for [{connection_id}]: {init_err}")

            return proc

    async def send_rpc_request(self, proc: subprocess.Popen, method: str, params: Optional[Dict[str, Any]] = None, timeout: float = 30.0) -> Dict[str, Any]:
        return await asyncio.wait_for(asyncio.to_thread(self._sync_send_rpc, proc, method, params), timeout=timeout)

    async def discover_tools(self, runtime_url: str, auth_token: str) -> List[Dict[str, Any]]:
        connection_id = f"discovery_{runtime_url}"
        proc = await self.get_or_spawn_process(connection_id, runtime_url, auth_token)
        try:
            resp = await self.send_rpc_request(proc, "tools/list", timeout=60.0)
            tools = resp.get("result", {}).get("tools", [])
            formatted = []
            for t in tools:
                if isinstance(t, dict):
                    props = t.get("inputSchema", {}).get("properties", {})
                    req_list = t.get("inputSchema", {}).get("required", [])
                    params = [
                        {"name": k, "type": v.get("type", "string"), "required": k in req_list}
                        for k, v in props.items()
                    ]
                    formatted.append({
                        "name": t.get("name", "tool"),
                        "description": t.get("description", ""),
                        "parameters": params
                    })
            return formatted
        except Exception as e:
            log.error(f"Error discovering tools via stdio for {runtime_url}: {e}")
            return []

    async def execute_tool(self, connection_id: str, runtime_url: str, tool_name: str, arguments: Dict[str, Any], auth_token: str) -> Tuple[Any, int]:
        proc = await self.get_or_spawn_process(connection_id, runtime_url, auth_token)
        try:
            resp = await self.send_rpc_request(proc, "tools/call", {"name": tool_name, "arguments": arguments}, timeout=60.0)
            if "error" in resp:
                err = resp["error"]
                return {"error": err.get("message", "Unknown error"), "code": err.get("code", 500)}, 500
            
            result = resp.get("result", {})
            content = result.get("content", [])
            
            is_error = result.get("isError", False)
            status_code = 400 if is_error else 200
            
            if isinstance(content, list):
                text_items = [c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"]
                if text_items and len(text_items) == len(content):
                    return "\n".join(text_items), status_code
                if len(content) == 1 and isinstance(content[0], dict) and content[0].get("type") == "text":
                    return content[0].get("text", ""), status_code
            return result, status_code
        except Exception as e:
            log.error(f"Error executing tool {tool_name} on {runtime_url}: {e}")
            return {"error": str(e)}, 500

subprocess_manager = McpSubprocessManager()
