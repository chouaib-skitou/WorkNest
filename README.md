# 🏠 WorkNest

**WorkNest** est une application de gestion de tâches basée sur une architecture microservices, conçue pour offrir aux équipes des outils de gestion de tâches, de collaboration et de productivité fluides. Le nom "WorkNest" représente un espace de travail structuré et collaboratif où les équipes peuvent gérer efficacement leur flux de travail.

---

## 🏢 Architecture

WorkNest est construit avec une architecture microservices pour garantir :
- **Scalabilité** : Chaque service peut évoluer indépendamment en fonction de sa charge de travail.
- **Maintenabilité** : La conception modulaire facilite la maintenance et l'extension des fonctionnalités.
- **Fiabilité** : Les services découplés réduisent le risque de point unique de défaillance.

### **Composants Clés**

📦 **Microservices** :
- **Identity Service** : Gère l'authentification, les connexions utilisateur, la génération de jetons, les profils utilisateurs et le contrôle d'accès basé sur les rôles.
- **Task Service** : Gère la création, la mise à jour, l'étiquetage et l'affectation des tâches.
- **Notification Service** : Envoie des notifications par e-mail et push.
- **Analytics Service** : Fournit des insights sur l'achèvement des tâches et la productivité.

🛡️ **API Gateway** :
- Route les requêtes vers les microservices appropriés.
- Gère l'authentification et le contrôle du trafic.

📩 **Event Bus** :
- Utilise RabbitMQ ou Kafka pour la communication en temps réel entre les services (ex : mises à jour des tâches déclenchant des notifications).

📊 **Monitoring et Logging** :
- **Prometheus & Grafana** : Collecte et visualise les métriques applicatives.
- **Elastic Stack (ELK)** : Journalisation centralisée pour suivre et déboguer efficacement les problèmes.

---

## 🖥️ Stack Technologique

### **Frontend**
- 🎨 **Framework** : React.js
- 🎨 **Styling** : Tailwind CSS
- 🛠️ **Gestion d'État** : Zustand
- 🌿 **Validation** : Zod
- 🌐 **Routing** : React Router

### **Backend**
- ⚡ **Framework** : Express.js (Node.js)
- 🔒 **Authentification** : JSON Web Tokens (JWT) & OAuth 2.0 (Google, GitHub)
- 💽 **Base de Données** : PostgreSQL (pour les données relationnelles)
- 🚀 **Cache** : Redis

### **Infrastructure & DevOps**
- 🐙 **Containerisation** : Docker
- ☘️ **Orchestration** : Kubernetes
- 🤖 **CI/CD** : GitHub Actions
- 📊 **Monitoring** : Prometheus & Grafana
- 📋 **Logging** : Elastic Stack (ELK)

---

## 🗂️ Structure du Projet

```
WorkNest/
├── frontend/             # Application React.js
├── services/             # Code des microservices
│   ├── identity-service/ # Gestion des utilisateurs et de l'authentification
│   ├── task-service/     # Gestion des tâches
│   ├── notification-service/ # Service de notifications
│   └── analytics-service/    # Service d'analytique
├── api-gateway/          # Code de l'API Gateway
├── event-bus/            # Configuration du bus d'événements
├── monitoring/           # Configuration de Prometheus et Grafana
├── deployment/           # Manifests Kubernetes et Dockerfiles
└── README.md             # Documentation du projet
```

---

## ✨ Pourquoi "WorkNest" ?

WorkNest représente :
- **Collaboration** : Un espace de travail structuré et organisé où les équipes s'épanouissent.
- **Efficacité** : Une gestion des tâches et des flux de travail simplifiée.
- **Scalabilité** : Conçu pour les équipes en croissance et les besoins évolutifs.

---

## 🚀 Démarrage
1. Clonez le dépôt :
   ```bash
   git clone https://github.com/chouaib-skitou/worknest.git
   ```
2. Configurez l'environnement pour chaque service avec des fichiers `.env`.
3. Démarrez les services avec Docker Compose :
   ```bash
   docker-compose up
   ```
4. Accédez au frontend à `http://localhost:3000`.

---

## 🤝 Contribuer
Les contributions sont les bienvenues ! Forkez le dépôt et soumettez une pull request.

---

## 🐝 Licence
Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

💡 *WorkNest : Un espace de travail productif, conçu pour les équipes !* 🚀
