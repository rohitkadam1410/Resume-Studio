import requests
import os

BASE_URL = "http://localhost:8000"

def test_fetch_jd():
    print("Testing /fetch-jd...")
    # Use a generic reliable URL or just a dummy one that scraper might handle generically
    url = "https://www.example.com" 
    try:
        response = requests.post(f"{BASE_URL}/fetch-jd", data={"url": url})
        if response.status_code == 200:
            print("Fetch JD Success:", response.json().get("job_description")[:50], "...")
        else:
            print("Fetch JD Failed:", response.text)
    except Exception as e:
        print("Fetch JD Error:", e)

def test_create_application():
    print("\nTesting /applications (CREATE)...")
    
    # Create a dummy PDF
    with open("dummy_resume.pdf", "wb") as f:
        f.write(b"%PDF-1.4 dummy content")
        
    files = {'resume': open("dummy_resume.pdf", "rb")}
    data = {
        "company_name": "Test Corp",
        "job_role": "Software Engineer",
        "job_link": "http://example.com/job",
        "status": "Applied",
        "job_description": "We need a coder."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/applications", data=data, files=files)
        if response.status_code == 200:
            print("Create Application Success:", response.json())
            return response.json().get("id")
        else:
            print("Create Application Failed:", response.text)
            return None
    except Exception as e:
        print("Create Application Error:", e)
        return None
    finally:
        files['resume'].close()
        # os.remove("dummy_resume.pdf")

def test_list_applications():
    print("\nTesting /applications (LIST)...")
    try:
        response = requests.get(f"{BASE_URL}/applications")
        if response.status_code == 200:
            apps = response.json()
            print(f"List Applications Success: Found {len(apps)} applications")
            for app in apps:
                print(f" - {app['company_name']} ({app['job_role']})")
        else:
            print("List Applications Failed:", response.text)
    except Exception as e:
        print("List Applications Error:", e)

if __name__ == "__main__":
    if not os.path.exists("application_resumes"):
        os.makedirs("application_resumes")
        
    test_fetch_jd()
    app_id = test_create_application()
    test_list_applications()
