
import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv()
from tailor import analyze_gaps
from pydantic import ValidationError

logging.basicConfig(level=logging.INFO)

# Dummy JD
JD = """
Software Engineer

We are looking for a Senior Software Engineer to join our team. 
Must have experience with Python, React, and AWS.
Experience in Healthcare or Pharma is a plus.
Responsible for building scalable APIs and frontend components.
"""

# Dummy Docx Path (using one found in the dir listing, or we mock extraction)
# I'll just mock extract_text_from_docx to avoid needing a real file for this unit test style check
import tailor
tailor.extract_text_from_docx = lambda x: "John Doe\nSoftware Engineer\nExperience: Python, Java. Built stuff."

def test_analyze():
    print("Testing analyze_gaps with new prompt...")
    try:
        result = analyze_gaps("dummy.docx", JD)
        print("Success! JSON parsed and validated.")
        print("Role Identity:", result.role_analysis.identity)
        print("Diagnosis Gaps:", result.diagnosis.gaps)
        print("Proposed Title:", result.proposed_title)
        print("Sections:", len(result.sections))
    except ValidationError as e:
        print("Validation Error:", e)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_analyze()
