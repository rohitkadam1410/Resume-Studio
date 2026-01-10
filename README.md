# Resume Tailor AI

Resume Tailor AI is a powerful tool that helps you customize your resume for specific job applications instantly. By leveraging **GPT-4** and advanced document processing, it analyzes your existing PDF resume and the target job description to generate a perfectly tailored version that highlights your most relevant skills and experience—all while preserving your original layout.

## 🚀 Features

- **Smart Analysis**: Uses OpenAI's GPT-4 to understand both your resume and the job description.
- **Layout Preservation**: Converts PDF to DOCX for editing and back to PDF, maintaining your professional formatting.
- **Instant Tailoring**: Rewrites content to match keywords and requirements.
- **Modern UI**: Clean, responsive, and user-friendly interface.
- **Privacy Focused**: Processes files locally and via secure API calls.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Python, FastAPI
- **AI Engine**: OpenAI GPT-4o
- **Document Processing**: `pdf2docx`, `docx2pdf`, `python-docx`

## 📋 Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- OpenAI API Key

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/resume-tailor.git
cd resume-tailor
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the root or backend directory (or export variables) with your OpenAI API Key:
```
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies.

```bash
cd ../frontend
npm install
```

## 🏃‍♂️ Running the Application

You need to run both the backend and frontend terminals simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
# Ensure venv is active
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the app!

## 📝 Usage

1. **Upload**: Select your current Resume (PDF format).
2. **Paste JD**: Copy the job description you are applying for.
3. **Generate**: Click the button and let the AI do the work.
4. **Download**: Get your new, tailored PDF ready for submission.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
