# 📈 Stock Screener (React + Node + TypeScript)

A **full-stack stock screener** application built with **React (Vite + TypeScript)** and **Node.js (Express + TypeScript)**, using **Prisma** and **SQLite**, with **JWT authentication**, **watchlist**, and **financial metrics** fetched from **Finnhub**.

The project is fully **Dockerized** (frontend + backend) and can be started with **one command**.

---

## ✨ Features

- 🔐 **Authentication**
  - Register / Login with JWT
  - Protected routes
  - Logout

- ⭐ **Watchlist**
  - Add / remove stocks
  - Per-user watchlist

- 📊 **Stock Screener**
  - Metrics: **P/E, P/B, ROE, EPS, Market Cap**
  - Color-coded values (good / mid / bad)
  - Filters (min / max, good only, bad only)
  - Market Cap formatted as **M / B / T**

- 🧠 **Snapshot cache**
  - Finnhub data cached for 15 minutes
  - Reduces API calls

- 🐳 **Docker ready**
  - Frontend container (Nginx)
  - Backend container (Node + Prisma)
  - SQLite with persistent volume

---

## 🛠 Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Custom CSS (dark UI)

### Backend
- Node.js
- Express
- TypeScript (ESM)
- Prisma ORM
- SQLite
- JWT Authentication

### DevOps
- Docker
- Docker Compose
- Nginx

---

## 🚀 Quick Start (Recommended – Docker)

### Prerequisites
- Docker Desktop
- A **Finnhub API key** → https://finnhub.io

---

### 1️⃣ Clone the repository
```bash
git clone <REPO_URL>
cd stock-screener-ts
```

### 2️⃣ Create .env file (root)
Create a file named .env in the root folder:
```bash
JWT_SECRET=super_secret_jwt
FINNHUB_TOKEN=YOUR_FINNHUB_API_KEY
```

### 3️⃣ Build and run
```bash
docker compose build
docker compose up -d
```

### 3️⃣ Build and run
- Frontend: http://localhost:8080
- Backend health check: http://localhost:3000/health

### 5️⃣ Stop containers
```bash
docker compose down
```
Reset database (SQLite):
```bash
docker compose down
```

## 🧪 Run without Docker (Development)

### Backend

```bash
cd backend
npm install
```
Create backend/.env:
```bash
PORT=3000
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=super_secret_jwt
FINNHUB_TOKEN=YOUR_FINNHUB_API_KEY
CORS_ORIGIN=http://localhost:5173
```
Run backend:
```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
```
Create frontend/.env:
```bash
VITE_API_BASE=http://localhost:3000
```
Run frontend:
```bash
npm run dev
```
### Open the app
```bash
http://localhost:5173
```






