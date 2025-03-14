# 🚀 How to Run WorkNest Services

This document explains how to run each service in the **WorkNest** application. Follow the steps below to set up and launch the Identity Service, Project Service, Frontend, and MailHog, either individually or together using Docker Compose.

---

## Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Run Locally](#run-locally)
    - [Identity Service](#-identity-service)
    - [Project Service](#-project-service)
    - [Storage Service](#-storage-service)
    - [Frontend](#-frontend)
3. [Run with Docker Compose](#-running-all-services-with-docker-compose)
4. [Run with Kubernetes](#-running-with-kubernetes)
5. [Additional Notes](#-additional-notes)
6. [WorkNest Usage Scenario](#worknest-usage-scenario)

---

## 🐘 Prerequisites

- **Node.js** (v16+ recommended) & **npm**
- **PostgreSQL** (or use Docker for your database)
- **Docker Compose** (for containerized deployments)
- **MailHog** (for capturing outgoing emails)
- **MinIO** (for object storage)
- **Kubernetes** (for container orchestration)
- **npm** (Node Package Manager)

---

## Run Locally

### 🔐 Identity Service

The Identity Service manages user authentication, registration, and JWT token generation.

#### Environment Variables

Create a `.env` file in the `identity-service` folder with the following content:

```env
# Server
PORT=5000
NODE_ENV=dev

# Database
DATABASE_URL="postgresql://root:root@localhost:5432/identity_service?schema=public"

# JWT Secret Keys
JWT_SECRET=cat ./config/jwt/JWT_SECRET
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=cat ./config/jwt/JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="no-reply@worknest.com"

# Frontend URL (for email verification links)
FRONTEND_URL=http://localhost:4200
BASE_URL=http://localhost:5000
```

#### Steps

1. **Create the Database:**
   Ensure your PostgreSQL instance has a database named `identity_service` (or create it).

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Generate JWT Secrets:**
   ```bash
   npm run generate:jwt
   ```

4. **Run Migrations (Development):**
   ```bash
   npm run migrate:dev
   ```

5. **Start the Service in Development Mode:**
   ```bash
   npm run dev
   ```

6. **API Documentation:**
   Access the docs at: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

### 📁 Project Service

The Project Service handles project management functionalities.

#### Environment Variables

Create a `.env` file in the `project-service` folder with the following content:

```env
# Server
PORT=5001
NODE_ENV=dev

# Database
DATABASE_URL="postgresql://root:root@localhost:5432/project_service?schema=public"

# Email Configuration (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="no-reply@worknest.com"

# Frontend URL (for email verification links)
FRONTEND_URL=http://localhost:4200
PROJECT_SERVICE_URL=http://localhost:5001
IDENTITY_SERVICE_URL=http://localhost:5000
```

#### Steps

1. **Create the Database:**
   Ensure your PostgreSQL instance has a database named `project_service` (or create it).

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Migrations (Development):**
   ```bash
   npm run migrate:dev
   ```

4. **Start the Service in Development Mode:**
   ```bash
   npm run dev
   ```

5. **API Documentation:**
   Access the docs at: [http://localhost:5001/api/docs](http://localhost:5001/api/docs)

---

### 🗄️ Storage Service

The Storage Service handles file storage functionalities.

#### Environment Variables

Create a `.env` file in the `storage-service` folder with the following content:

```env
# Server
NODE_ENV=dev
PORT=5002

# MinIO Configuration
MINIO_INTERNAL_ENDPOINT=http://localhost:9000
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_ACCESS_KEY="rootroot"
MINIO_SECRET_KEY="rootroot"
MINIO_BUCKET="worknest-bucket"

# Services URL
IDENTITY_SERVICE_URL=http://localhost:5000
```

#### Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Service in Development Mode:**
   ```bash
   npm run dev
   ```

3. **API Documentation:**
   Access the docs at: [http://localhost:5002/api/docs](http://localhost:5002/api/docs)

---

### 🎨 Frontend

The Frontend is built with Angular.

#### Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```

3. **Access the Frontend:**
   Open your browser at: [http://localhost:4200](http://localhost:4200)

---

## 🐳 Running All Services with Docker Compose

If you prefer to run everything in containers, use the provided Docker Compose configuration.

### Steps

1. **Navigate to the Deployment Folder:**
   ```bash
   cd deployment
   ```

2. **Build and Start Containers:**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the Services:**
   - **Identity Service Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
   - **Project Service Docs:** [http://localhost:5001/api/docs](http://localhost:5001/api/docs)
   - **Storage Service Docs:** [http://localhost:5002/api/docs](http://localhost:5002/api/docs)
   - **Frontend:** [http://localhost:4200](http://localhost:4200)
   - **MailHog UI:** [http://localhost:8025](http://localhost:8025)
   - **MinIO Console:** [http://localhost:9001](http://localhost:9001)

---

## 🚀 Running with Kubernetes

This section explains how to deploy WorkNest on a local Kubernetes cluster (using Minikube).

### Kubernetes Manifests Structure

The Kubernetes configuration files are stored in the `k8s/` directory:

```plaintext
k8s/
  00-namespace.yaml
  01-postgres.yaml
  02-mailhog.yaml
  03-minio.yaml
  04-minio-init.yaml
  05-identity-service.yaml
  06-project-service.yaml
  07-storage-service.yaml
  08-frontend.yaml
```

### Deploying WorkNest on Kubernetes

1. **Start Minikube:**
   ```bash
   minikube start --driver=docker
   ```

2. **Verify by running:**
   ```bash
   kubectl get nodes
   ```

3. **Deploy All Resources:**
   From the deployment directory, run:
   ```bash
   ./deploy.sh
   ```
   This script will apply all manifests in order, creating the worknest namespace and deploying each service.

4. **Check the status with:**
   ```bash
   kubectl get pods -n worknest
   ```

### Accessing the Services

#### Using Port-Forwarding

Run the provided `port-forward.sh` script:

```bash
./port-forward.sh
```

This script forwards the following ports:

- **Identity Service:** [http://localhost:5000](http://localhost:5000)
- **Project Service:** [http://localhost:5001](http://localhost:5001)
- **Storage Service:** [http://localhost:5002](http://localhost:5002)
- **Frontend:** [http://localhost:4200](http://localhost:4200)
- **MailHog UI:** [http://localhost:8025](http://localhost:8025)
- **Postgres DB:** [http://localhost:5432](http://localhost:5432)

#### Direct Access for NodePort Services

MinIO is now exposed as a NodePort. To access MinIO directly:

1. **Get your Minikube IP:**
   ```bash
   minikube ip
   ```

2. **Access:**
   - **MinIO API:** `http://<minikube_ip>:30900`
   - **MinIO Console:** `http://<minikube_ip>:30901`

### Database Administration

To update a user’s role (e.g., change `admin@worknest.com` to `ROLE_ADMIN`):

1. **Port-forward the Postgres Service:**
   ```bash
   kubectl port-forward -n worknest svc/postgres-db 5432:5432
   ```

2. **Connect using `psql`:**
   ```bash
   psql -h localhost -U root -d identity_service
   ```
   Use the password `root`.

3. **Update the User Role:**
   ```sql
   UPDATE "User"
   SET role = 'ROLE_ADMIN'
   WHERE email = 'admin@worknest.com';
   ```

4. **Confirm with:**
   ```sql
   SELECT id, email, role FROM "User" WHERE email = 'admin@worknest.com';
   ```

5. **Exit `psql`:**
   ```bash
   \q
   ```

---

## 🔔 Additional Notes

### Email Verification
After registration, you'll receive an email on the SMTP server (MailHog). Click the verification button in the email to verify your account.

### User Roles
To have a role of Admin or Manager, register a user and then update the role directly in the database.

### Environment Setup
Make sure each service’s `.env` file is properly configured before running the services.

---

## WorkNest Usage Scenario

This document describes a typical workflow scenario for using the WorkNest platform. Follow these steps to set up and start managing your projects and teams.

## 1. Initial Setup

### a. Register as Admin
- **Register:**  
  Sign up using the email `admin@worknest.com` via the registration page.
- **Verify Email:**  
  Check the verification email using MailHog by navigating to [http://localhost:8025/](http://localhost:8025/).  
- **Update Role:**  
  After verifying the email, manually update the role of the registered user in your database from `ROLE_EMPLOYEE` (default) to `ROLE_ADMIN`.

### b. Log In
- **Login:**  
  Log into the platform using the updated admin credentials.

## 2. Create Manager and Employee Accounts

### a. Create Manager Accounts
- **Access Users Page:**  
  Navigate to the `/users` section.
- **Add Manager:**  
  Click on "Add New User" and fill in the details for a new user.
- **Select Role:**  
  Choose the **Manager** role for the new user.
- **Repeat:**  
  Create one or more manager accounts as needed.

### b. Create Employee Accounts
- **Add Employees:**  
  Similarly, use the "Add New User" feature to create 5, 10, or more employee accounts.
- **Assign Role:**  
  Assign these users the role **ROLE_EMPLOYEE**.
- **Force Password Reset:**  
  Each time a new user is created, a reset-password-request email is sent (via MailHog).  
  - Instruct each user to check their email at [http://localhost:8025/](http://localhost:8025/) and update their password accordingly.

## 3. Project and Task Management

### a. Create a New Project
- **Create Project:**  
  As an Admin (or Manager with permissions), navigate to the Projects section and create a new project by filling out the required details.
- **Assign Roles:**  
  After the project is created, assign a manager to the project and add employees who will work on the project.

### b. Manage Project Workflow
- **Access Project Details:**  
  Go to the project details page (e.g., `/project/:id`).
- **Create Stages:**  
  Create various stages (such as Backlog, Ready, Pending, etc.) to structure your project workflow.
- **Add Tasks:**  
  Within each stage, create tasks and assign them to the appropriate employees.
- **Attach Documents:**  
  You can also add relevant documents to the project or specific stages.

## 4. Final Notes

- **Enjoy Using WorkNest:**  
  You now have a fully functional platform where Admins can manage users and projects. Managers and employees can collaborate on tasks, track progress, and store project documents.
- **Feedback and Issues:**  
  If you encounter any bugs or have suggestions for improvements, please create an issue on our repository. Your feedback is highly appreciated!

---

This scenario outlines the step-by-step process to set up an admin account, create manager and employee users, initialize a project, and manage tasks and stages within WorkNest. Enjoy using the app!

---

💡 **WorkNest: Your structured space for efficient teamwork!**