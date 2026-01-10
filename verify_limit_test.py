
import requests
import os
import time

BASE_URL = "http://localhost:8001"

# Register a test user
EMAIL = f"test_{int(time.time())}@example.com"
PASSWORD = "Password123!"

def register_and_login():
    print(f"Registering user {EMAIL}...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={"email": EMAIL, "password": PASSWORD})
    if resp.status_code != 200:
        print("Registration failed:", resp.text)
        # Try login if already exists
        pass
    
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    else:
        print("Login failed:", resp.text)
        return None

def create_dummy_files():
    with open("dummy_resume.pdf", "wb") as f:
        f.write(b"%PDF-1.4 empty pdf")
    return "dummy_resume.pdf"

def analyze_anonymous(filename):
    print("Testing Anonymous Analysis...")
    # Clean up any IP logs if possible? No, we can't easily.
    # But we can try to hit the limit.
    
    # We need to simulate 3 calls.
    for i in range(1, 4):
        print(f"  Anonymous Call #{i}")
        files = {'resume': open(filename, 'rb')}
        data = {'job_description': 'Software Engineer'}
        resp = requests.post(f"{BASE_URL}/analyze", files=files, data=data)
        print(f"  Status: {resp.status_code}")
        if resp.status_code == 200:
            print("  Success")
        elif resp.status_code == 403:
            print("  Limit Reached (Expected for #3)")
        else:
            print("  Unexpected:", resp.text)

def analyze_authenticated(token, filename):
    print("\nTesting Authenticated Analysis...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # We try 3 calls. Should all succeed.
    for i in range(1, 4):
        print(f"  Authenticated Call #{i}")
        files = {'resume': open(filename, 'rb')}
        data = {'job_description': 'Software Engineer'}
        resp = requests.post(f"{BASE_URL}/analyze", files=files, data=data, headers=headers)
        print(f"  Status: {resp.status_code}")
        if resp.status_code == 200:
            print("  Success")
        else:
            print("  Failed:", resp.text)

if __name__ == "__main__":
    if not os.path.exists("dummy_resume.pdf"):
        create_dummy_files()
    
    # NOTE: This test relies on IP based limiting. If the machine running this test 
    # has already used up the limit, anonymous calls will fail immediately.
    
    # 1. Test Authenticated FIRST to ensure they are NOT blocked even if IP is blocked
    token = register_and_login()
    if token:
        analyze_authenticated(token, "dummy_resume.pdf")
    else:
        print("Could not get token, skipping auth test.")

    # 2. Test Anonymous
    # analyze_anonymous("dummy_resume.pdf")
