# 🛠️ WorkNest

**WorkNest** is a microservices-based Task Manager application designed to empower teams with seamless task management, collaboration, and productivity tools. The name "WorkNest" represents a structured and efficient workspace where tasks are organized and executed seamlessly.

<div align="center">
  <a href="https://www.youtube.com/watch?v=gErpJee99Fs" target="_blank">
    <img 
      src="https://img.youtube.com/vi/gErpJee99Fs/maxresdefault.jpg" 
      alt="WorkNest Overview Video" 
      width="100%"
      style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" 
    />
    <br>
    <p style="margin: 10px 0; font-size: 16px; font-weight: bold;">
      🎥 Watch WorkNest Overview Video
    </p>
  </a>
</div>

---

## 🏗️ Architecture Overview

WorkNest is built using a microservices architecture to ensure:
- **Scalability**: Each service can scale independently based on its workload.
- **Maintainability**: Modular design makes it easier to maintain and extend functionality.
- **Reliability**: Decoupled services reduce the risk of a single point of failure.

### **Key Components**

📦 **Microservices**:
- **Identity Service**: Manages authentication, user login, token generation, user profiles, and role-based access control.
- **Project Service**: Manages project creation, updates, tagging, and assignment.
- **Storage Service**: Manages file storage and retrieval.

<!-- 🛡️ **API Gateway**:
- Routes requests to the appropriate microservices.
- Handles authentication and rate-limiting. -->

---

## 🖥️ Tech Stack

### **Frontend**
- 🖼️ **Framework**: Angular 19
- 🎨 **Styling**: Tailwind CSS
- 🔄 **State Management**: Angular Services and RxJS
- 🛠️ **Validation**: Angular Forms
- 🌐 **Routing**: Angular Router

### **Backend**
- ⚡ **Framework**: Express.js (Node.js)
- 🔐 **Authentication**: JSON Web Tokens (JWT)
- 🗄️ **Database**: PostgreSQL (for relational data)
<!-- - 🚀 **Caching**: Redis -->

### **Infrastructure & DevOps**
- 🐳 **Containerization**: Docker
- ☸️ **Orchestration**: Kubernetes
- 🤖 **CI/CD**: GitHub Actions
<!-- - 📈 **Monitoring**: Prometheus & Grafana
- 📋 **Logging**: Elastic Stack (ELK) -->

---

## 📂 Folder Structure

```
WorkNest/
├── frontend/             # Angular 19 application
├── services/             # Microservices code
│   ├── identity-service/  # Authentication and user management service
│   ├── project-service/   # Project management service
│   ├── storage-service/   # Storage service
├── deployment/           # Kubernetes manifests and Dockerfiles
└── README.md             # Project documentation
```

---

## ✨ Why "WorkNest"?

"WorkNest" represents an organized and efficient workspace where tasks are structured, allowing teams to collaborate smoothly and enhance productivity. It symbolizes:
- **Collaboration**: Encourages teamwork and effective task management.
- **Efficiency**: A well-structured nest where tasks are executed smoothly.
- **Scalability**: Designed for growing teams and enterprises.

---

## 🚀 Get Started

1. Clone the repository:
   ```bash
   git clone https://github.com/chouaib-skitou/worknest.git
   ```
2. Set up the environment for each service using `.env` files.
3. Use Docker Compose to spin up the services:
   ```bash
   docker-compose up
   ```
4. Access the frontend at `http://localhost:4200`.
5. Follow the detailed instructions in the [How to Run](https://github.com/chouaib-skitou/WorkNest/blob/main/How_to_Run.md) guide:

<div align="center">
  <a href="https://github.com/chouaib-skitou/WorkNest/blob/main/How_to_Run.md" 
     style="display: inline-block; 
            background-color: #4a90e2; 
            color: white; 
            font-weight: bold; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 6px; 
            box-shadow: 0 4px 14px rgba(74, 144, 226, 0.4);">
    📖 How to Run Guide →
  </a>
</div>

---

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

---

## 📜 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

💡 *WorkNest: Your structured space for efficient teamwork!*