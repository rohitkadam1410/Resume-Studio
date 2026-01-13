import requests
from bs4 import BeautifulSoup
import re
import os
import json
import openai
import mlflow
import logging
from prompts import EXTRACT_JOB_METADATA_PROMPT

logger = logging.getLogger(__name__)

# Configure MLflow (ensure consistent DB path)
MLFLOW_DB_PATH = "sqlite:///mlflow.db"
# Use a separate experiment for Scraper to avoid cluttering Resume Analysis
# Or keep same if they are related. Different experiment is cleaner.
SCRAPER_EXPERIMENT_NAME = "Job Description Extraction"

# Utility to ensure experiment exists
# (Doing this setup inside function or global scope? Global is better but be careful with multiple imports setting URI)
# We will just set URI and name inside the function to be safe if it's running in same process.

def fetch_job_description(url: str) -> str:
    """
    Fetches job description text from a given URL.
    Attempts to parse common sites like LinkedIn, Indeed, Naukri, or generic fallbacks.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Basic logic to strip scripts and styles
        for script in soup(["script", "style"]):
            script.decompose()

        # Site-specific extraction attempts could go here
        # For now, we'll do a generic "best effort" extraction of the main content
        
        # Try to find common job description containers
        potential_classes = [
            # LinkedIn
            "description__text", 
            "core-section-container__content",
            "show-more-less-html__markup",
            # Indeed
            "jobsearch-JobComponent-description",
            "jobsearch-JobComponent",
            # Naukri (often tough, dynamic classes)
            "job-desc", 
            "styles_job-desc-container__", 
            # Generic
            "job-description",
            "description"
        ]
        
        text_content = ""
        
        # 1. Try specific classes
        for cls in potential_classes:
            element = soup.find(class_=re.compile(cls))
            if element:
                text_content = element.get_text(separator="\n").strip()
                break
        
        # 2. If no specific class found, try generic body text but cleaned
        if not text_content:
            if soup.body:
                text_content = soup.body.get_text(separator="\n").strip()

        # Clean up excessive newlines
        cleaned_text = re.sub(r'\n\s*\n', '\n\n', text_content)
        return cleaned_text

    except Exception as e:
        logger.error(f"Error fetching JD: {e}")
        return f"Error fetching JD: {str(e)}"

def extract_job_metadata(text: str) -> dict:
    """
    Uses LLM to extract Company Name and Job Role from JD text.
    """
    try:
        if len(text) < 50:
             return {"company": "", "role": ""}

        client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        prompt = EXTRACT_JOB_METADATA_PROMPT.format(text=text[:2000])
        
        # Setup MLflow for this specific task
        mlflow.set_tracking_uri(MLFLOW_DB_PATH)
        mlflow.set_experiment(SCRAPER_EXPERIMENT_NAME)
        
        with mlflow.start_run(run_name="extract_metadata"):
            mlflow.log_param("model", "gpt-4o")
            mlflow.set_tag("prompt_template", EXTRACT_JOB_METADATA_PROMPT[:5000])
            mlflow.log_param("text_length", len(text))
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                response_format={ "type": "json_object" }
            )
            
            content = response.choices[0].message.content
            mlflow.log_text(content, "llm_response.json")
            
            data = json.loads(content)
            
            mlflow.log_param("extracted_company", data.get("company", ""))
            mlflow.log_param("extracted_role", data.get("role", ""))
            
            return data
            
    except Exception as e:
        logger.error(f"Metadata extraction failed: {e}")
        return {"company": "", "role": ""}
