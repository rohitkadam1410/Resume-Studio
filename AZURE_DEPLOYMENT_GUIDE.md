# Azure Deployment Guide for Resume Studio

This guide walks you through deploying the Resume Studio application (Frontend + Backend) to Azure using Docker containers and Azure App Service.

## Prerequisites
1.  **Azure CLI**: [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2.  **Docker Desktop**: Ensure Docker is running.
3.  **Active Azure Subscription**.

## Step 1: Login and Create Resource Group

Open your terminal (PowerShell or Bash) and log in to Azure:

```bash
az login
```

Create a resource group to organize your resources:

```bash
az group create --name ResumeStudioGroup --location eastus
```

## Step 2: Create Azure Container Registry (ACR)

Create a registry to store your Docker images. *Note: Registry name must be unique globally.*

```bash
az acr create --resource-group ResumeStudioGroup --name resumestudioregistry123 --sku Basic --admin-enabled true
```

Get the login server name:

```bash
$ACR_LOGIN_SERVER=$(az acr show --name resumestudioregistry123 --query "loginServer" --output tsv)
echo $ACR_LOGIN_SERVER
```

Log in to the registry:

```bash
az acr login --name resumestudioregistry123
```

## Step 3: Build and Push Docker Images

### Backend

Build the backend image:

```bash
docker build -t $ACR_LOGIN_SERVER/resume-backend:v1 ./backend
```

Push to ACR:

```bash
docker push $ACR_LOGIN_SERVER/resume-backend:v1
```

### Frontend

**IMPORTANT**: You must provide the *production* backend URL during the build if you want to bake it in, BUT for Next.js runtime config, we will set it as an App Service Environment Variable today.

Build the frontend image:

```bash
docker build -t $ACR_LOGIN_SERVER/resume-frontend:v1 ./frontend
```

Push to ACR:

```bash
docker push $ACR_LOGIN_SERVER/resume-frontend:v1
```

## Step 4: Create App Service Plan

Create a plan (Linux B1 is good for testing):

```bash
az appservice plan create --name ResumeStudioPlan --resource-group ResumeStudioGroup --sku B1 --is-linux
```

## Step 5: Deploy Backend

Create the Backend Web App:

```bash
az webapp create --resource-group ResumeStudioGroup --plan ResumeStudioPlan --name resume-studio-backend-api --deployment-container-image-name $ACR_LOGIN_SERVER/resume-backend:v1
```

**Configure Backend Settings**:
You need to set the OpenAI API Key and Secret Key.

```bash
az webapp config appsettings set --resource-group ResumeStudioGroup --name resume-studio-backend-api --settings OPENAI_API_KEY="your-key-here" SECRET_KEY="your-secure-secret"
```

*Wait for the deployment to finish. Your backend URL will be `https://resume-studio-backend-api.azurewebsites.net`.*

## Step 6: Deploy Frontend

Create the Frontend Web App:

```bash
az webapp create --resource-group ResumeStudioGroup --plan ResumeStudioPlan --name resume-studio-frontend --deployment-container-image-name $ACR_LOGIN_SERVER/resume-frontend:v1
```

**Configure Frontend Settings**:
Point the frontend to the backend URL.

```bash
az webapp config appsettings set --resource-group ResumeStudioGroup --name resume-studio-frontend --settings NEXT_PUBLIC_API_URL="https://resume-studio-backend-api.azurewebsites.net"
```

## Step 7: Final Verification

1.  Navigate to your Frontend URL: `https://resume-studio-frontend.azurewebsites.net`
2.  Try uploading a resume.
3.  If you see "Error connecting to server", check the Console configuration in Azure Portal -> App Service -> Log Stream.

## Troubleshooting

-   **CORS**: If the backend rejects the frontend, you might need to update `backend/main.py` CORS config to allow the specific Azure Frontend URL instead of just `*` (though `*` usually works for testing).
-   **Ports**: Ensure App Service is listening on the correct port. Azure App Service for Containers listens on 80/443 public and forwards to port 80 inside container by default.
    -   Since our containers listen on 8000 (backend) and 3000 (frontend), we need to tell Azure that.
    
    **Backend Config:**
    ```bash
    az webapp config appsettings set --resource-group ResumeStudioGroup --name resume-studio-backend-api --settings WEBSITES_PORT=8000
    ```

    **Frontend Config:**
    ```bash
    az webapp config appsettings set --resource-group ResumeStudioGroup --name resume-studio-frontend --settings WEBSITES_PORT=3000
    ```

## Local Testing with Docker Compose

To test locally before deploying:

```bash
docker-compose up --build
```


---

# Option 2: Azure Portal (UI) Method

If you prefer using the graphical interface instead of the CLI, follow these steps.

## Step 1: Create Resources in Portal

1.  **Log in** to [portal.azure.com](https://portal.azure.com).
2.  **Create Resource Group**:
    *   Search for "Resource groups", click **Create**.
    *   Name: `ResumeStudioGroup`, Region: `East US`.
    *   Review + create.

3.  **Create Container Registry (ACR)**:
    *   Search for "Container Registries", click **Create**.
    *   Resource Group: `ResumeStudioGroup`.
    *   Registry Name: `resumestudioregistry123` (must be unique).
    *   SKU: `Basic`.
    *   **IMPORTANT**: Go to the **Access keys** tab (after creation) and enable **Admin user**. Copy the `Login server`, `Username`, and `Password`.

## Step 2: Build and Push Images (Requires Terminal)

You still need to use your local terminal to build the code into images and upload them. You cannot do this part in the browser.

1.  **Login to Docker**:
    ```bash
    docker login resumestudioregistry123.azurecr.io -u <username> -p <password>
    ```

2.  **Build and Push Backend**:
    ```bash
    docker build -t resumestudioregistry123.azurecr.io/resume-backend:v1 ./backend
    docker push resumestudioregistry123.azurecr.io/resume-backend:v1
    ```

3.  **Build and Push Frontend**:
    ```bash
    docker build -t resumestudioregistry123.azurecr.io/resume-frontend:v1 ./frontend
    docker push resumestudioregistry123.azurecr.io/resume-frontend:v1
    ```

## Step 3: Create App Services (Web Apps)

### Backend App Service
1.  Search for **"Web App for Containers"** (Publisher: Microsoft) and click **Create**.
    *   *Note: You can also select "Web App" and switch 'Publish' to 'Docker Container', but "Web App for Containers" is more direct.*
2.  **Basics**:
    *   Resource Group: `ResumeStudioGroup`.
    *   Name: `resume-studio-backend-api`.
    *   Publish: **Docker Container**.
    *   Operating System: **Linux**.
    *   Plan: Create new `ResumeStudioPlan` (B1).
3.  **Docker**:
    *   Options: **Single Container**.
    *   Image Source: **Azure Container Registry**.
    *   Registry: `resumestudioregistry123`.
    *   Image: `resume-backend`, Tag: `v1`.
4.  **Review + Create**.
5.  **Configuration** (After creation):
    *   Go to the resource -> **Settings** -> **Environment variables**.
    *   Add:
        *   `OPENAI_API_KEY`: your-key
        *   `SECRET_KEY`: your-secret
        *   `WEBSITES_PORT`: `8000`
    *   Click **Apply**.

### Frontend App Service
1.  Create another Web App.
2.  Name: `resume-studio-frontend`.
3.  Docker Settings: Choose image `resume-frontend`, Tag `v1`.
4.  **Configuration** (After creation):
    *   Go to **Environment variables**.
    *   Add:
        *   `NEXT_PUBLIC_API_URL`: `https://resume-studio-backend-api.azurewebsites.net`
        *   `WEBSITES_PORT`: `3000`
    *   Click **Apply**.

## Final Verify
Visit `https://resume-studio-frontend.azurewebsites.net`.

