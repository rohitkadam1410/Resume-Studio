
import requests
import json

def test_survey_submission():
    url = "http://localhost:8000/api/survey"
    payload = {
        "email": "test@example.com",
        "interested": True,
        "willing_price": "$20/mo",
        "feedback": "Love the product! Ready to pay."
    }
    
    try:
        # Note: This requires the backend to be running
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Survey submission verified successfully!")
        else:
            print("❌ Survey submission failed.")
    except Exception as e:
        print(f"Error: {e}")
        print("💡 Make sure the backend is running at http://localhost:8000")

if __name__ == "__main__":
    test_survey_submission()
