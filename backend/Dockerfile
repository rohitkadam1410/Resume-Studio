FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for document conversion
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/cat/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure the database and upload directories exist
RUN mkdir -p application_resumes

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
