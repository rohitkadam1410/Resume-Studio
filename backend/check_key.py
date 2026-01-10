import os
from dotenv import load_dotenv

load_dotenv("d:\\projects\\LLM-Projects\\.env")

key = os.environ.get("OPENAI_API_KEY")
if key:
    print("API Key Checked: Present")
else:
    print("API Key Checked: Missing")
