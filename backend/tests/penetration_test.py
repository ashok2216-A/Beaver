import httpx

BASE_URL = "http://localhost:8000/api/v1"

def print_test(name, result, detail=""):
    color = "\033[92m[PASS]\033[0m" if result else "\033[91m[FAIL]\033[0m"
    print(f"{color} {name}")
    if detail:
        print(f"       -> {detail}")

def run_pen_test():
    print("--- Starting Beaver AI Security Penetration Test ---")
    print("-" * 50)

    # 1. Auth Bypass Check
    try:
        res = httpx.get(f"{BASE_URL}/agents")
        print_test("Auth Bypass Check (GET /agents)", res.status_code == 401, f"Status: {res.status_code}")
    except Exception as e:
        print_test("Auth Bypass Check", False, str(e))

    # 2. Billing Config Leak Check
    try:
        res = httpx.get(f"{BASE_URL}/billing/config")
        data = res.json()
        sensitive_leaked = "razorpay_key_secret" in data or "stripe_secret_key" in data
        print_test("Sensitive Data Leak Check (/billing/config)", not sensitive_leaked, "Checked for secrets in response")
    except Exception as e:
        print_test("Sensitive Data Leak Check", False, str(e))

    # 3. Rate Limiting Stress Test (Quick version)
    try:
        print("[*] Testing Rate Limiting (Sending 15 rapid requests to /billing/config)...")
        status_codes = []
        for _ in range(15):
            res = httpx.get(f"{BASE_URL}/billing/config")
            status_codes.append(res.status_code)
        
        has_429 = 429 in status_codes
        print_test("Rate Limiting Check", has_429, f"Status codes received: {set(status_codes)}")
    except Exception as e:
        print_test("Rate Limiting Check", False, str(e))

    # 4. IDOR Simulation (Generic)
    print("[*] Testing IDOR (Accessing Agent ID 9999 without ownership)...")
    # This requires a valid token but we simulate the attempt
    try:
        res = httpx.get(f"{BASE_URL}/agents/9999", headers={"Authorization": "Bearer invalid_token"})
        print_test("IDOR/Invalid Token Check", res.status_code in [401, 403, 404], f"Status: {res.status_code}")
    except Exception as e:
        print_test("IDOR Check", False, str(e))

    print("-" * 50)
    print("[SUCCESS] Penetration Test Complete.")

if __name__ == "__main__":
    run_pen_test()
