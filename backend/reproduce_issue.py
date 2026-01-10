
import os
import sys
from pdf_handler import pdf_to_docx
from tailor import extract_text_from_docx

def reproduce():
    pdf_path = os.path.abspath("temp_0ea07cd3_Resume Rohit Kadam.pdf")
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return

    print(f"Converting {pdf_path} to DOCX...")
    docx_path = pdf_to_docx(pdf_path)
    print(f"Converted to {docx_path}")

    print("Extracting text...")
    text = extract_text_from_docx(docx_path)
    
    with open("debug_reproduction.txt", "w", encoding="utf-8") as f:
        f.write(text)
    
    print("Extracted text saved to debug_reproduction.txt")
    
    # Check for missing sections keywords
    keywords = ["Conference", "Patent", "Publication"]
    for kw in keywords:
        if kw.lower() in text.lower():
            print(f"Found keyword: {kw}")
        else:
            print(f"MISSING keyword: {kw}")

if __name__ == "__main__":
    reproduce()
