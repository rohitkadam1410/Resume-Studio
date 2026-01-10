import sys
sys.path.insert(0, '.')
from tailor import extract_text_from_docx

text = extract_text_from_docx('temp_0ea07cd3_Resume Rohit Kadam.docx')
with open('test_output.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print(f'Extracted {len(text)} characters')
print('Output written to test_output.txt')
