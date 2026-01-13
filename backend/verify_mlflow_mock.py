import os
import shutil
from unittest.mock import MagicMock, patch
import mlflow
import json

# Set dummy env var to pass initialization checks
os.environ["OPENAI_API_KEY"] = "sk-dummy-key"

from tailor import analyze_gaps, extract_text_from_docx, ANALYZE_GAPS_PROMPT_TEMPLATE

# Mock docx extraction to avoid needing a real file
def mock_extract_text(docx_path):
    return "Resume content here. Experienced Software Engineer."

# Prepare a dummy response
DUMMY_LLM_RESPONSE = {
    "sections": [
        {
            "section_name": "Summary",
            "section_type": "Summary",
            "gaps": ["Missing keywords"],
            "suggestions": ["Add metrics"],
            "edits": []
        }
    ],
    "company_name": "Tech Corp",
    "job_title": "Senior Dev",
    "initial_score": 75,
    "projected_score": 85
}

def verify_logging():
    print("Starting Mock Verification...")
    
    # Clean up previous runs?
    # shutil.rmtree("./mlruns", ignore_errors=True) # Don't delete if we want to keep history? 
    # Actually, using sqlite.
    
    with patch("tailor.extract_text_from_docx", side_effect=mock_extract_text):
        with patch("openai.OpenAI") as MockClient:
            # Setup mock client
            mock_instance = MockClient.return_value
            mock_response = MagicMock()
            mock_response.choices[0].message.content = json.dumps(DUMMY_LLM_RESPONSE)
            mock_instance.chat.completions.create.return_value = mock_response
            
            # Run analysis
            print("Running analyze_gaps...")
            result = analyze_gaps("dummy.docx", "Job Description here")
            
            print("Result:", result)
            
            # Check MLflow
            print("Checking MLflow...")
            mlflow.set_tracking_uri("sqlite:///mlflow.db")
            experiment = mlflow.get_experiment_by_name("Resume Tailor Analysis")
            runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id])
            
            if runs.empty:
                print("FAILURE: No runs found.")
                return

            last_run = runs.iloc[0]
            print(f"Verified Run ID: {last_run.run_id}")
            
            # Check Tags
            client = mlflow.tracking.MlflowClient()
            run = client.get_run(last_run.run_id)
            tags = run.data.tags
            print("Tags found:", tags.keys())
            
            if "prompt_template" in tags:
                print("SUCCESS: prompt_template tag found.")
                # Verify content
                if tags["prompt_template"] == ANALYZE_GAPS_PROMPT_TEMPLATE[:5000]:
                     print("SUCCESS: Tag content matches source.")
                else:
                     print("WARNING: Tag content mismatch.")
            else:
                print("FAILURE: prompt_template tag MISSING.")

if __name__ == "__main__":
    verify_logging()
