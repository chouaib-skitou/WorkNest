# 🚀 How to Run WorkNest Services

This document explains how to run each service in the **WorkNest** application. Follow the steps below to set up and launch the Identity Service, Project Service, Frontend, and MailHog, either individually or together using Docker Compose.

---

## 🐘 Prerequisites

- **Node.js** (v16+ recommended) & **npm**
- **PostgreSQL** (or use Docker for your database)
- **Docker Compose** (for containerized deployments)
- **MailHog** (for capturing outgoing emails)
- **npm** (Node Package Manager)

---

## 🔐 Identity Service

The Identity Service manages user authentication, registration, and JWT token generation.

### Environment Variables

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

### Steps

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

## 📁 Project Service

The Project Service handles project management functionalities.

### Environment Variables

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

### Steps

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

## 🎨 Frontend

The Frontend is built with Angular.

### Steps

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
   - **Frontend:** [http://localhost:4200](http://localhost:4200)
   - **MailHog UI:** [http://localhost:8025](http://localhost:8025)

---

## 🔔 Additional Notes

### Email Verification
After registration, you'll receive an email on the SMTP server (MailHog). Click the verification button in the email to verify your account.

### User Roles
To have a role of Admin or Manager, register a user and then update the role directly in the database.

### Environment Setup
Make sure each service’s `.env` file is properly configured before running the services.

---

💡 **WorkNest: Your structured space for efficient teamwork!**