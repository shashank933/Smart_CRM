# SmartCRM

AI-powered customer relationship management platform built with React, Express, and SQLite.

## Features

- **Dashboard & Analytics** — Revenue trends, deal pipeline, win rates, and key metrics
- **Contact Management** — Full CRUD with company associations and activity tracking
- **Deal Pipeline** — Kanban board with stages from lead to closed won/lost
- **Companies** — Organization profiles with linked contacts and deals
- **Invoices** — Generate, send, and track invoices with payment statuses
- **Tickets** — Support ticket system with priorities, statuses, and comments
- **Conversations** — Multi-channel inbox (email, WhatsApp, SMS)
- **Calendar** — Schedule meetings, tasks, and calls with drag-and-drop
- **Integrations** — Connect Gmail, WhatsApp, and HubSpot with real sync
- **Workflows** — Automation engine with triggers and actions
- **AI Assistant** — Deal scoring, email generation, and predictive insights
- **Global Search** — Search across contacts, companies, deals, invoices, and tickets
- **Onboarding Guide** — Step-by-step setup checklist for new users
- **Dark Mode** — Midnight, dark, and light themes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, React Router, Recharts, Lucide React |
| Backend | Express, TypeScript, tsx |
| Database | SQLite (sql.js) |
| Auth | JWT, bcryptjs |
| AI | OpenAI API integration |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Run

```bash
# Terminal 1 — Backend (port 3001)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open `http://localhost:5173` and create an account.

### Build

```bash
cd client
npm run build
```

Output in `client/dist/`.

## Project Structure

```
SmartCRM/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Layout/      # Sidebar, Header, Login
│   │   │   ├── Dashboard/   # Analytics & charts
│   │   │   ├── Contacts/    # Contact list & detail
│   │   │   ├── Companies/   # Company list & detail
│   │   │   ├── Deals/       # Deal pipeline
│   │   │   ├── Invoices/    # Invoice management
│   │   │   ├── Tickets/     # Support tickets
│   │   │   ├── Conversations/ # Multi-channel inbox
│   │   │   ├── Calendar/    # Calendar & scheduling
│   │   │   ├── Integrations/ # Gmail, WhatsApp, HubSpot
│   │   │   ├── Workflows/   # Automation engine
│   │   │   ├── AIAssistant/ # AI chat & insights
│   │   │   ├── Guide/       # Onboarding checklist
│   │   │   └── ui/          # Shared UI components
│   │   ├── store/           # Zustand state management
│   │   ├── styles/          # CSS themes
│   │   └── api.js           # API client
│   └── package.json
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── config/          # Database setup & seed
│   │   └── middleware/      # Auth middleware
│   └── package.json
└── .gitignore
```
