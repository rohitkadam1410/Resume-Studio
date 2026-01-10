# Azure Deployment Guide for Resume Tailor

This document provides step-by-step instructions to deploy the Resume Tailor application to **Azure Web Apps for Containers**.

## Prerequisites
- An active Azure Subscription.
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed.
- [Docker](https://www.docker.com/products/docker-desktop/) installed locally.

---

## 🚀 Deployment Steps

### 1. Set Up Azure Resources
Login to Azure and create a Resource Group:
```bash
az login
az group create --name ResumeTailorRG --location eastus
```

### 2. Create Azure Container Registry (ACR)
Create a registry to host your Docker images:
```bash
az acr create --resource-group ResumeTailorRG --name resumetailorreg --sku Basic
az acr login --name resumetailorreg
```

### 3. Build and Push Docker Images

#### Backend
```bash
cd backend
docker build -t resumetailorreg.azurecr.io/backend:latest .
docker push resumetailorreg.azurecr.io/backend:latest
```

#### Frontend
```bash
cd ../frontend
docker build -t resumetailorreg.azurecr.io/frontend:latest .
docker push resumetailorreg.azurecr.io/frontend:latest
```

### 4. Create Azure Web Apps
Create two Web Apps (one for backend, one for frontend):
```bash
# Backend Web App
az webapp create --resource-group ResumeTailorRG --plan MyAppServicePlan --name resumetailor-api --deployment-container-image-name resumetailorreg.azurecr.io/backend:latest

# Frontend Web App
az webapp create --resource-group ResumeTailorRG --plan MyAppServicePlan --name resumetailor-ui --deployment-container-image-name resumetailorreg.azurecr.io/frontend:latest
```

### 5. Configure Environment Variables
Set the necessary environment variables in the Azure Portal or via CLI:

#### Backend
- `SECRET_KEY`: A long random string for JWT.
- `GOOGLE_API_KEY`: Your Gemini API key.
- `NEXT_PUBLIC_API_URL`: `https://resumetailor-api.azurewebsites.net` (used if frontend needs to know backend URL).

#### Frontend
- `NEXT_PUBLIC_API_URL`: `https://resumetailor-api.azurewebsites.net`

```bash
az webapp config appsettings set --resource-group ResumeTailorRG --name resumetailor-api --settings GOOGLE_API_KEY="your_key" SECRET_KEY="your_secret"
```

---

## ⚠️ Important Considerations

### Persistence (SQLite)
By default, files in an Azure Web App container are ephemeral. To persist the `applications.db` and uploaded resumes:
1. Create an **Azure Storage Account**.
2. Create a **File Share**.
3. Use **Azure App Service Storage Mount** to mount the file share to `/app/data` (and update `database.py` to point there).

### PDF Conversion
The current backend uses `docx2pdf`, which requires Microsoft Word (Windows/macOS). In a Linux container (Azure default), this **will fail**.
> [!IMPORTANT]
> Change the conversion logic in `pdf_handler.py` to use a Linux-compatible library like `libreoffice` or a service like `CloudConvert`. 
> 
> Example CLI command for Dockerfile: `apt-get install -y libreoffice`

### CORS
Ensure the backend `main.py` allows requests from your frontend Azure URL:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://resumetailor-ui.azurewebsites.net"],
    ...
)
```
