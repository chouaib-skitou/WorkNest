# 🛠️ WorkNest

**WorkNest** is a microservices-based Task Manager application designed to empower teams with seamless task management, collaboration, and productivity tools. The name "WorkNest" represents a structured and efficient workspace where tasks are organized and executed seamlessly.

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
- **Notification Service**: Sends email and push notifications.
- **Analytics Service**: Provides insights on task completion and productivity.

🛡️ **API Gateway**:
- Routes requests to the appropriate microservices.
- Handles authentication and rate-limiting.

📮 **Event Bus**:
- Uses RabbitMQ or Kafka for real-time communication between services (e.g., task updates triggering notifications).

📈 **Monitoring and Logging**:
- **Prometheus & Grafana**: Collects and visualizes application metrics.
- **Elastic Stack (ELK)**: Centralized logging to track and debug issues effectively.

---

## 🖥️ Tech Stack

### **Frontend**
- 🖼️ **Framework**: React.js
- 🎨 **Styling**: Tailwind CSS
- 🔄 **State Management**: Zustand
- 🛠️ **Validation**: Zod
- 🌐 **Routing**: React Router

### **Backend**
- ⚡ **Framework**: Express.js (Node.js)
- 🔐 **Authentication**: JSON Web Tokens (JWT) & OAuth 2.0 (Google, GitHub)
- 🗄️ **Database**: MySQL (for relational data)
- 🚀 **Caching**: Redis

### **Infrastructure & DevOps**
- 🐳 **Containerization**: Docker
- ☸️ **Orchestration**: Kubernetes
- 🤖 **CI/CD**: GitHub Actions
- 📈 **Monitoring**: Prometheus & Grafana
- 📋 **Logging**: Elastic Stack (ELK)

---

## 📂 Folder Structure

```
WorkNest/
├── frontend/             # React.js application
├── services/             # Microservices code
│   ├── identity-service/ # Authentication and user management service
│   ├── project-service/     # Project management service
│   ├── notification-service/ # Notification service
│   └── analytics-service/    # Analytics service
├── api-gateway/          # API gateway code
├── event-bus/            # Event bus setup
├── monitoring/           # Prometheus and Grafana setup
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
4. Access the frontend at `http://localhost:3000`.

---

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

---

## 📜 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

💡 *WorkNest: Your structured space for efficient teamwork!*
