import unittest
from unittest.mock import MagicMock, patch
import json
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from tailor import analyze_gaps

class TestTailorAnalysis(unittest.TestCase):

    @patch('tailor.openai.OpenAI')
    @patch('tailor.extract_text_from_docx')
    def test_analyze_gaps_with_suggestions(self, mock_extract, mock_openai_class):
        # Mock DOCX text extraction
        mock_extract.return_value = "Sample Resume Content"

        # Mock OpenAI Response
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        
        # We need two responses: one for analyze_gaps (sections) and one for calculate_scores
        
        # 1. Mock Analysis Response
        analysis_json = {
            "initial_score": 50,
            "projected_score": 85,
            "sections": [
                {
                    "section_name": "Summary",
                    "section_type": "Summary",
                    "original_text": "Old Summary",
                    "gaps": ["No metrics"],
                    "suggestions": ["Add quant results", "mention leadership"],
                    "edits": [
                        {
                            "target_text": "Old Summary",
                            "new_content": "New Better Summary",
                            "action": "replace",
                            "rationale": "Improved impact"
                        }
                    ]
                }
            ]
        }
        
        # 2. Mock Score Response
        score_json = {
            "initial_score": 55,
            "projected_score": 90,
            "reasoning": "Great improvements"
        }
        
        # Set up side effects for the mocked create calls
        # We expect 2 calls. 
        # Call 1: Analysis
        # Call 2: Scoring
        
        mock_response_1 = MagicMock()
        mock_response_1.choices = [MagicMock(message=MagicMock(content=json.dumps(analysis_json)))]
        
        mock_response_2 = MagicMock()
        mock_response_2.choices = [MagicMock(message=MagicMock(content=json.dumps(score_json)))]

        # Determine which call returns what. This is tricky with simple side_effect if args differ, but side_effect iterator works.
        mock_client.chat.completions.create.side_effect = [mock_response_1, mock_response_2]

        # ACT
        result = analyze_gaps("dummy.docx", "Job Description Here")

        # ASSERT
        print("Result Keys:", result.keys())
        self.assertIn("sections", result)
        section = result["sections"][0]
        self.assertIn("suggestions", section)
        self.assertEqual(section["suggestions"], ["Add quant results", "mention leadership"])
        self.assertEqual(result["initial_score"], 55) # Should come from the robust scoring step
        
        print("Verification Successful: Suggestions field parsed correctly.")

if __name__ == '__main__':
    unittest.main()
