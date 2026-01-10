from backend.tailor import analyze_gaps
import os
import unittest
from unittest.mock import MagicMock, patch
import json

class TestMissingSections(unittest.TestCase):
    @patch('backend.tailor.extract_text_from_docx')
    @patch('backend.tailor.openai.OpenAI')
    def test_analysis_with_sections(self, mock_openai_class, mock_extract):
        # Mock Resume Text with clear sections
        mock_extract.return_value = """
        John Doe
        Software Engineer
        
        Professional Summary
        Experienced developer with 5 years in Python and React.
        
        Experience
        Software Engineer at Tech Co.
        - Built things.
        
        Projects
        Resume Tailor
        - Built a tool to tailor resumes.
        
        Education
        BS CS
        """
        
        # Mock LLM response to see if it *can* find them with current prompt
        # Actually I want to see if the REAL LLM finds them, but I can't easily call real LLM here without cost/env.
        # But if the user says it fails, it means the LLM is NOT returning them.
        # So I will assume the issue is the prompt instructions or the text format.
        
        # Let's try to simulate a "bad" LLM response that misses them, to verify my handling code?
        # No, the user says the SOLUTION fails. 
        
        # I'll modify the prompt to be much more forceful about finding these SPECIFIC sections.
        pass

if __name__ == "__main__":
    # Just printing the prompt to verify I change it later
    from backend.tailor import analyze_gaps
    print("Test setup complete")
