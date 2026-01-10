import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    try:
        # We don't have a health endpoint, but we can check docs
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("Server is UP")
        else:
            print(f"Server returned {response.status_code}")
    except Exception as e:
        print(f"Server connection failed: {e}")

def verify_modules():
    print("Verifying Auth...")
    # Register string
    email = f"test_{int(time.time())}@example.com"
    password = "Password123!"
    
    reg_response = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if reg_response.status_code == 200:
        print("Registration: SUCCESS")
        token = reg_response.json()["access_token"]
    else:
        print(f"Registration Failed: {reg_response.text}")
        return

    # Login
    login_response = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if login_response.status_code == 200:
        print("Login: SUCCESS")
    else:
        print(f"Login Failed: {login_response.text}")
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check Usage (Resume Router)
    usage_response = requests.get(f"{BASE_URL}/api/usage", headers=headers)
    if usage_response.status_code == 200:
        print("Usage Check: SUCCESS")
        print(usage_response.json())
    else:
        print(f"Usage Check Failed: {usage_response.text}")

    # Check Applications (Applications Router)
    app_response = requests.get(f"{BASE_URL}/applications", headers=headers)
    if app_response.status_code == 200:
        print("Get Applications: SUCCESS")
    else:
        print(f"Get Applications Failed: {app_response.text}")

if __name__ == "__main__":
    time.sleep(2) # Wait for server start
    test_health()
    verify_modules()
