# LMS-Simple: Library Management System

A simple, self-contained Library Management System built with Node.js, Express, TypeScript, SQLite, and React.

## Features

- **Book Management**: CRUD operations for books with inventory tracking
- **User Management**: Registration, authentication with JWT, role-based access (ADMIN, LIBRARIAN, MEMBER)
- **Loan System**: Issue, return, renew books with due date tracking
- **Reservations**: Reserve books, auto-fulfill on return
- **Search**: Simple LIKE-based search with suggestions
- **Recommendations**: Category-based recommendations with cold-start fallback
- **Inventory Alerts**: Low-stock detection
- **Notifications**: Due/overdue email reminders via Mailhog
- **Multi-Agent Architecture**: Modular in-process agents with orchestrator
- **Daily Scheduler**: Automated notification jobs at 08:00
- **React Frontend**: Modern SPA with React, TypeScript, and Vite

## Tech Stack

- **Backend**: Node.js + Express (TypeScript)
- **Frontend**: React + Vite (TypeScript)
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT with RBAC
- **Email**: Nodemailer → Mailhog
- **DevOps**: Docker, docker-compose, Jenkins

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Local Development

**Backend:**
```bash
# Install dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env

# Seed the database
npm run seed

# Start development server
npm run dev
```

**Frontend:**
```bash
# In a new terminal
cd lms-simple/frontend
npm install

# Start development server (proxies to backend)
npm run dev
```

### Docker (Recommended)

```bash
# From project root
docker compose up --build
```

Services:
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3000
- **Mailhog UI**: http://localhost:8025

### Health Check

```bash
curl http://localhost:3000/health
```

## Default Users (Seeded)

| Email | Password | Role |
|-------|----------|------|
| admin@lms.test | Admin@123 | ADMIN |
| lib@lms.test | Lib@12345 | LIBRARIAN |
| mem@lms.test | Mem@12345 | MEMBER |

## API Endpoints

### Auth (Public)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login, returns JWT

### Books (Protected)
- `GET /books?q=` - List/search books
- `POST /books` - Create book (ADMIN, LIBRARIAN)
- `PATCH /books/:id` - Update book (ADMIN, LIBRARIAN)
- `DELETE /books/:id` - Delete book (ADMIN, LIBRARIAN)

### Loans (Protected)
- `POST /loans/issue` - Issue book to user
- `POST /loans/return` - Return a loan
- `POST /loans/renew` - Renew a loan
- `GET /loans?user_id=&status=` - List loans

### Reservations (Protected)
- `POST /reservations` - Create reservation
- `POST /reservations/:id/cancel` - Cancel reservation
- `GET /reservations?user_id=&status=` - List reservations

### Search (Protected)
- `POST /search/semantic` - Search books by query
- `GET /search/suggest?prefix=` - Auto-suggest titles

### Recommendations (Protected)
- `GET /recommendations/user/:userId` - User recommendations
- `GET /recommendations/similar/:bookId` - Similar books

### Inventory (ADMIN, LIBRARIAN)
- `GET /inventory/low-stock?threshold=` - Low stock items

### Notifications (ADMIN, LIBRARIAN)
- `POST /notifications/send-due-reminders` - Trigger due reminders

## Project Structure

```
lms-simple/
├─ backend/
│  ├─ src/
│  │  ├─ app.ts              # Express app setup
│  │  ├─ server.ts           # Server entry point
│  │  ├─ config.ts           # Environment config
│  │  ├─ db.ts               # SQLite setup & schema
│  │  ├─ seed.ts             # Database seeder
│  │  ├─ middleware/
│  │  │  ├─ auth.ts          # JWT verification
│  │  │  └─ rbac.ts          # Role-based access
│  │  ├─ routes/             # API route handlers
│  │  ├─ services/
│  │  │  ├─ orchestrator.service.ts
│  │  │  └─ agents/          # Agent modules
│  │  ├─ schedulers/
│  │  │  └─ daily.jobs.ts    # Cron jobs
│  │  └─ utils/
│  │     ├─ crypto.ts        # Password hashing
│  │     └─ mailer.ts        # Email sending
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ Dockerfile
│  └─ .env.example
├─ lms-simple/
│  └─ frontend/
│     ├─ src/
│     │  ├─ api/             # Axios API client
│     │  ├─ components/      # Reusable components
│     │  ├─ context/         # React context (Auth)
│     │  ├─ pages/           # Page components
│     │  ├─ types/           # TypeScript types
│     │  ├─ App.tsx          # Main app with routing
│     │  └─ main.tsx         # Entry point
│     ├─ package.json
│     ├─ vite.config.ts
│     ├─ Dockerfile
│     └─ nginx.conf
├─ docker-compose.yml
├─ Jenkinsfile
├─ README.md
└─ postman/
   └─ lms-simple.postman_collection.json
```

## Jenkins CI/CD

The Jenkinsfile provides:
1. **Checkout** - Pull source code
2. **Install & Build** - `npm ci && tsc`
3. **Test** - Run tests (placeholder)
4. **Docker Build** - Build image with build number tag
5. **Docker Push** - Push to registry
6. **Deploy** (Optional) - SSH deploy to server

### Jenkins Parameters
- `DEPLOY_ENABLED` (boolean) - Enable/disable deploy stage
- `DOCKER_REGISTRY` - Docker registry URL

### Required Credentials
- `docker-reg-cred` - Docker registry username/password
- `deploy-ssh-key` - SSH key for deployment server

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| JWT_SECRET | change-me | JWT signing secret |
| JWT_EXPIRES_IN | 24h | Token expiration |
| SMTP_HOST | mailhog | SMTP server host |
| SMTP_PORT | 1025 | SMTP server port |
| SMTP_FROM | noreply@lms.test | From address |
| DB_PATH | ./data/lms.db | SQLite database path |

## License

MIT
