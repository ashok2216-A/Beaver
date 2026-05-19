import asyncio
import json
import logging
import os
import shutil
import subprocess
import tempfile
import hashlib
from typing import Any, Dict, List, Optional, Tuple

log = logging.getLogger(__name__)

class McpSubprocessManager:
    """
    Manages long-running MCP subprocesses communicating over standard stdio streams (stdin/stdout).
    Uses robust synchronous Popen wrapped in asyncio.to_thread to completely bypass Windows event loop incompatibility (NotImplementedError).
    """
    def __init__(self):
        self._processes: Dict[str, subprocess.Popen] = {}
        self._locks: Dict[str, asyncio.Lock] = {}

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
        config_arg = ""
        if auth_token:
            try:
                config_arg = json.dumps({
                    "googledrive": {"oauthToken": auth_token, "accessToken": auth_token, "token": auth_token},
                    "gmail": {"oauthToken": auth_token, "accessToken": auth_token, "token": auth_token},
                    "googlecalendar": {"oauthToken": auth_token, "accessToken": auth_token, "token": auth_token},
                    "googlesheets": {"oauthToken": auth_token, "accessToken": auth_token, "token": auth_token},
                    "googledocs": {"oauthToken": auth_token, "accessToken": auth_token, "token": auth_token},
                    "google": {"oauthToken": auth_token, "accessToken": auth_token},
                    "github": {"personalAccessToken": auth_token, "token": auth_token},
                    "slack": {"botToken": auth_token, "token": auth_token},
                    "notion": {"notionApiKey": auth_token, "apiKey": auth_token, "token": auth_token},
                    "instagram": {"instagramAccessToken": auth_token, "accessToken": auth_token, "token": auth_token},
                    "token": auth_token
                })
            except Exception as e:
                log.error(f"Failed to build smithery config arg: {e}")

            url_lower = runtime_url.lower()
            token_hash = hashlib.md5(auth_token.encode("utf-8")).hexdigest()
            
            # Universal token environment variables
            env["AUTH_TOKEN"] = auth_token
            env["MCP_ACCESS_TOKEN"] = auth_token
            env["API_KEY"] = auth_token
            env["TOKEN"] = auth_token

            if "github" in url_lower:
                env["GITHUB_PERSONAL_ACCESS_TOKEN"] = auth_token
                env["GITHUB_TOKEN"] = auth_token
            elif "slack" in url_lower:
                env["SLACK_TOKEN"] = auth_token
                env["SLACK_BOT_TOKEN"] = auth_token
            elif "notion" in url_lower:
                env["NOTION_API_KEY"] = auth_token
                env["NOTION_TOKEN"] = auth_token
            elif "instagram" in url_lower:
                env["INSTAGRAM_TOKEN"] = auth_token
                env["INSTAGRAM_ACCESS_TOKEN"] = auth_token
            elif "google" in url_lower or "drive" in url_lower or "gdrive" in url_lower or "gmail" in url_lower or "calendar" in url_lower or "sheet" in url_lower or "doc" in url_lower:
                env["GOOGLE_DRIVE_TOKEN"] = auth_token
                env["GOOGLE_DRIVE_ACCESS_TOKEN"] = auth_token
                env["GOOGLE_ACCESS_TOKEN"] = auth_token
                env["GDRIVE_ACCESS_TOKEN"] = auth_token
                env["GMAIL_ACCESS_TOKEN"] = auth_token
                env["GOOGLE_CALENDAR_ACCESS_TOKEN"] = auth_token
                try:
                    temp_cred_path = os.path.join(tempfile.gettempdir(), f"google_cred_{token_hash}.json")
                    with open(temp_cred_path, "w", encoding="utf-8") as f:
                        json.dump({
                            "access_token": auth_token,
                            "refresh_token": auth_token,
                            "token_type": "Bearer",
                            "scope": "https://www.googleapis.com/auth/drive",
                            "expiry_date": 9999999999999
                        }, f)
                    env["GDRIVE_CREDENTIALS_PATH"] = temp_cred_path
                    env["GOOGLE_APPLICATION_CREDENTIALS"] = temp_cred_path
                except Exception as e:
                    log.error(f"Failed to create google temp credentials file: {e}")

        parts = runtime_url.split(":", 1)
        scheme = parts[0].lower()
        package = parts[1] if len(parts) > 1 else ""

        if scheme == "docker":
            docker_cmd = shutil.which("docker") or "docker"
            cmd = [docker_cmd, "run", "-i", "--rm"]
            if auth_token:
                cmd.extend(["-e", f"GITHUB_PERSONAL_ACCESS_TOKEN={auth_token}"])
                cmd.extend(["-e", f"GITHUB_TOKEN={auth_token}"])
            cmd.append(package)
            return cmd, env
        elif scheme == "smithery":
            npx_cmd = shutil.which("npx") or ("npx.cmd" if os.name == "nt" else "npx")
            cmd = [npx_cmd, "-y", "@smithery/cli@latest", "run", package]
            if config_arg:
                cmd.extend(["--config", config_arg])
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

        log.info(f"Spawning MCP Popen Subprocess [{connection_id}]: {' '.join(cmd)}")
        proc = subprocess.Popen(
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
            return await asyncio.to_thread(self._sync_spawn, connection_id, cmd, env)

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
            if isinstance(content, list) and len(content) == 1 and isinstance(content[0], dict) and content[0].get("type") == "text":
                return content[0].get("text", ""), 200
            return result, 200
        except Exception as e:
            log.error(f"Error executing tool {tool_name} on {runtime_url}: {e}")
            return {"error": str(e)}, 500

subprocess_manager = McpSubprocessManager()
