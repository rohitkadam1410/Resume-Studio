import requests
import json
import os
import time
from reportlab.pdfgen import canvas
import mlflow

# Setup
BASE_URL = "http://127.0.0.1:8000"
MLFLOW_DB = "sqlite:///mlflow.db"

def create_dummy_pdf(filename="dummy_resume.pdf"):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, "John Doe")
    c.drawString(100, 730, "Software Engineer")
    c.drawString(100, 710, "Experience: Built a scalable backend using Python and FastAPI.")
    c.save()
    return filename

def run_analysis_trigger():
    print("1. Creating Dummy PDF...")
    pdf_path = create_dummy_pdf()
    
    print("2. Registering/Logging in...")
    email = f"mlflow_test_{int(time.time())}@example.com"
    password = "Password123!"
    
    # Register
    requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    # Login
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("3. Uploading & Analyzing...")
    files = {'resume': open(pdf_path, 'rb')}
    data = {'job_description': 'Looking for a Senior Software Engineer with Python and FastAPI experience.'}
    
    # This triggers analyze_gaps -> mlflow logging
    response = requests.post(f"{BASE_URL}/analyze", headers=headers, files=files, data=data)
    
    if response.status_code == 200:
        print("Analysis Success!")
        print(json.dumps(response.json(), indent=2)[:200] + "...")
    else:
        print(f"Analysis Failed: {response.text}")

    files['resume'].close()

def check_mlflow_data():
    print("\n4. Checking MLflow Data...")
    mlflow.set_tracking_uri(MLFLOW_DB)
    
    try:
        experiment = mlflow.get_experiment_by_name("Resume Tailor Analysis")
        if not experiment:
            print("Experiment not found!")
            return

        runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id])
        print(f"Found {len(runs)} runs in experiment '{experiment.name}'.")
        
        if not runs.empty:
            last_run = runs.iloc[0]
            print(f"Last Run ID: {last_run.run_id}")
            print(f"Artifact URI: {last_run.artifact_uri}")
            
            # Check for artifact
            client = mlflow.tracking.MlflowClient()
            artifacts = client.list_artifacts(last_run.run_id)
            print("Artifacts:")
            for art in artifacts:
                print(f" - {art.path}")
                
            # Verify prompt_template.txt exists
            if any(a.path == "prompt_template.txt" for a in artifacts):
                print("SUCCESS: 'prompt_template.txt' found in artifacts.")
            else:
                print("FAILURE: 'prompt_template.txt' NOT found.")
    except Exception as e:
        print(f"Error checking MLflow: {e}")

if __name__ == "__main__":
    try:
        run_analysis_trigger()
        check_mlflow_data()
    except Exception as e:
        print(f"Script failed: {e}")
