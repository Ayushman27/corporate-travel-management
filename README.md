# ✈️ CTM — Corporate Travel Management System

A production-style, AI-powered, multi-agent Corporate Travel Management System (SaaS) with role-based workflows, Excel-based HRMS + Finance integration, and a conversational AI layer.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Tailwind)                    │
│  Employee Dashboard │ Manager Panel │ Finance Panel │ Admin Panel  │
└───────────────────────────────┬──────────────────────────────────┘
                                │ REST API (JWT)
┌───────────────────────────────▼──────────────────────────────────┐
│              BACKEND (Node.js + Express)                          │
│  Auth │ Trip │ Finance │ Admin routes                             │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│                    AGENT ORCHESTRATOR                             │
│                                                                   │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐   │
│  │ Planning     │  │ Optimization  │  │  Chat Agent (LLM)    │   │
│  │ Agent        │──▶ Agent         │  │  Groq/OpenAI/Mock    │   │
│  │ (Routes)     │  │ (3 Plans)     │  └──────────────────────┘   │
│  └──────────────┘  └───────────────┘                             │
│                                                                   │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐   │
│  │ HRMS Agent   │  │ Finance Agent │  │ Booking Agent        │   │
│  │ (Excel)      │  │ (Excel)       │  │ (Mock APIs)          │   │
│  └──────────────┘  └───────────────┘  └──────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌───────────────┐                             │
│  │ Notification │  │ Policy Engine │                             │
│  │ Agent (WA)   │  │ (Rules)       │                             │
│  └──────────────┘  └───────────────┘                             │
└───────────────────────────────┬──────────────────────────────────┘
               ┌────────────────┼────────────────┐
        ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
        │  MongoDB    │  │ hrms.xlsx   │  │ finance.xlsx│
        └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 📁 Project Structure

```
CTM/
├── backend/
│   ├── src/
│   │   ├── agents/            # 7 AI Agents + Orchestrator
│   │   │   ├── planningAgent.js
│   │   │   ├── optimizationAgent.js
│   │   │   ├── chatAgent.js
│   │   │   ├── bookingAgent.js
│   │   │   ├── financeAgent.js
│   │   │   ├── hrmsAgent.js
│   │   │   ├── notificationAgent.js
│   │   │   └── agentOrchestrator.js
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # Express routes
│   │   ├── models/            # Mongoose schemas
│   │   ├── services/          # Excel, Policy, Audit, Mock APIs
│   │   ├── middleware/        # Auth (JWT), RBAC, Error handler
│   │   └── utils/             # Logger, Retry, Validators, Seeds
│   ├── data/                  # hrms.xlsx + finance.xlsx (generated)
│   ├── tests/                 # Jest unit + API tests
│   ├── server.js
│   └── .env.example
│
└── frontend/
    └── src/
        ├── pages/             # Login, Dashboard, TripRequest, TripDetail,
        │                      # ManagerPanel, FinancePanel, AdminPanel
        ├── components/        # Navbar, Sidebar, TripPlans, ChatInterface…
        ├── context/           # AuthContext, TripContext
        └── services/          # axios API client
```

---

## 🤖 AI Agents

| Agent | Responsibility |
|---|---|
| **Planning Agent** | Generates multi-modal route options (flight/train/bus/metro) using mock transport APIs |
| **Optimization Agent** | Scores routes on cost / speed / comfort; saves 3 plans (lowest_cost, fastest, most_comfortable) |
| **Chat Agent** | Conversational LLM interface (Groq / OpenAI / Gemini / mock) for trip modification |
| **Booking Agent** | Confirms each segment via mock APIs; generates tickets with PNR/reference numbers |
| **Finance Agent** | Reads finance.xlsx, checks monthly budget, creates proposals, applies deductions after approval |
| **HRMS Agent** | Reads hrms.xlsx, validates employee existence, manager mapping, and budget eligibility |
| **Notification Agent** | Sends WhatsApp messages (mock) at every workflow milestone |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and API keys

# Generate Excel sample data
node src/utils/seedExcel.js

# Seed MongoDB with demo users
node src/utils/seedDB.js

# Start backend
npm run dev
# → http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. Login with Demo Accounts

| Role     | Email                 | Password     |
|----------|-----------------------|--------------|
| Employee | arjun@company.com     | password123  |
| Manager  | vikram@company.com    | password123  |
| Finance  | deepak@company.com    | password123  |
| Admin    | suresh@company.com    | password123  |

---

## 🔑 Environment Variables (backend/.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ctm_db
JWT_SECRET=your_super_secret_key

# LLM Provider (groq | openai | gemini | mock)
LLM_PROVIDER=mock
GROQ_API_KEY=your_groq_api_key

# WhatsApp (mock by default)
WHATSAPP_API_TOKEN=mock_token

# Policy limits
MAX_TRIP_BUDGET_EMPLOYEE=50000
MAX_TRIP_BUDGET_MANAGER=150000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login & get JWT |
| POST | `/api/auth/register` | Register new user |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/trip/request` | Submit trip → runs all agents |
| GET  | `/api/trip/my` | Employee's trips |
| GET  | `/api/trip/:tripId` | Trip detail + plans + approvals |
| GET  | `/api/trip/plans/:tripId` | AI-generated plans |
| POST | `/api/trip/chat` | Chat with AI agent |
| POST | `/api/trip/approve/manager` | Manager approve/reject |
| POST | `/api/trip/approve/finance` | Finance approve/reject + Excel update |
| POST | `/api/trip/book` | Confirm booking |
| GET  | `/api/finance/report` | Budget report from Excel |
| GET  | `/api/finance/department-summary` | Dept breakdown from HRMS Excel |
| GET  | `/api/admin/dashboard` | Admin stats |
| GET  | `/api/admin/audit-logs` | Full audit trail |

---

## 🔄 Full Workflow

```
Employee submits trip
       ↓
 HRMS Agent validates (Excel)
       ↓
 Planning Agent generates routes
       ↓
 Optimization Agent → 3 plans (cost / speed / comfort)
       ↓
 Policy Engine checks company rules
       ↓
 WhatsApp → Employee + Manager notified
       ↓
 Manager Approves/Rejects
       ↓
 Finance Agent checks budget (Excel)
       ↓
 Finance Approves → Excel updated + WhatsApp sent
       ↓
 Employee selects plan & books
       ↓
 Booking Agent → PNR generated per segment
       ↓
 WhatsApp ticket sent to employee
       ↓
 Audit log captures every step
```

---

## 🧪 Tests

```bash
cd backend
npm test
```

Tests cover:
- Optimization scoring algorithm
- Policy engine rules
- Planning route generation
- API endpoint auth/validation

---

## 🚢 Deployment

### Backend → Render / Railway

1. Push `backend/` to GitHub
2. Set environment variables in Render dashboard
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add MongoDB Atlas URI

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import in Vercel
3. Set `VITE_API_URL` if not using proxy
4. Framework: Vite

---

## 🔐 Security Features

- JWT authentication with 7-day expiry
- Role-based access control (employee / manager / finance / admin)
- Rate limiting: 100 req / 15 min per IP
- Helmet security headers
- Passwords bcrypt-hashed (12 rounds)
- Finance Excel is never auto-modified — proposal → approval → apply

---

## 🌟 Unique Features

| Feature | Description |
|---|---|
| Multi-agent AI | 7 specialised agents coordinated by an orchestrator |
| Excel HRMS + Finance | Real xlsx read/write — no separate HR/Finance system needed |
| Multi-modal travel | Combines flight + train + metro + cab in one route |
| AI chat modification | Natural language trip modification with LLM backend |
| Policy engine | Role-based budget limits and travel rules |
| Full audit trail | Every action logged with actor, timestamp, IP |
| WhatsApp notifications | Milestone-based alerts throughout workflow |
| Retry logic | All external API calls use exponential backoff |
