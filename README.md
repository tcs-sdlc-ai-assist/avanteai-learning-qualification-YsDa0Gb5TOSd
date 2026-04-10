# Avante AI Compliance

A full-stack compliance management platform built with ASP.NET Core 9 (backend) and React 18 with Vite (frontend).

## Architecture

```
┌─────────────────────┐         ┌─────────────────────────┐
│                     │  HTTP   │                         │
│   React 18 (Vite)   │◄──────►│  ASP.NET Core 9 Web API │
│   Frontend (SPA)    │  JSON   │  Backend                │
│                     │         │                         │
└─────────────────────┘         └────────────┬────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │    Database      │
                                    │  (SQL Server /   │
                                    │   PostgreSQL)    │
                                    └─────────────────┘
```

- **Frontend**: React 18 single-page application bundled with Vite, styled with Tailwind CSS
- **Backend**: ASP.NET Core 9 Web API using C# 12+, following RESTful conventions
- **Communication**: JSON over HTTP/HTTPS between frontend and backend

## Tech Stack

### Backend
- **Runtime**: .NET 9
- **Language**: C# 12+
- **Framework**: ASP.NET Core 9 Web API
- **Authentication**: JWT Bearer tokens
- **Validation**: FluentValidation / Data Annotations
- **ORM**: Entity Framework Core

### Frontend
- **Library**: React 18
- **Build Tool**: Vite
- **Language**: JavaScript (ES6+) with JSX
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios / Fetch API
- **Prop Validation**: PropTypes

## Folder Structure

```
avante-ai-compliance/
├── backend/
│   ├── src/
│   │   ├── AvanteCompliance.Api/          # Web API project (controllers, middleware)
│   │   │   ├── Controllers/              # API endpoint controllers
│   │   │   ├── Middleware/               # Custom middleware (auth, error handling)
│   │   │   ├── Program.cs               # Application entry point
│   │   │   └── appsettings.json         # Backend configuration
│   │   ├── AvanteCompliance.Core/        # Domain models, interfaces, business logic
│   │   │   ├── Entities/                # Domain entities
│   │   │   ├── Interfaces/             # Repository & service interfaces
│   │   │   └── Services/               # Business logic services
│   │   └── AvanteCompliance.Infrastructure/ # Data access, external services
│   │       ├── Data/                    # DbContext, migrations
│   │       └── Repositories/           # Repository implementations
│   └── tests/
│       └── AvanteCompliance.Tests/       # Unit and integration tests
├── frontend/
│   ├── public/                           # Static assets
│   ├── src/
│   │   ├── assets/                      # Images, fonts, static files
│   │   ├── components/                  # Reusable UI components
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── pages/                       # Page/route components
│   │   ├── services/                    # API service modules
│   │   ├── utils/                       # Utility functions
│   │   ├── App.jsx                      # Root component with routing
│   │   ├── main.jsx                     # Application entry point
│   │   └── index.css                    # Global styles (Tailwind directives)
│   ├── index.html                       # HTML template
│   ├── vite.config.js                   # Vite configuration
│   ├── tailwind.config.js               # Tailwind CSS configuration
│   └── package.json                     # Frontend dependencies
└── README.md                            # This file
```

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 18+](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- SQL Server or PostgreSQL (depending on configuration)

## Setup Instructions

### Backend

1. **Navigate to the API project directory:**
   ```bash
   cd backend/src/AvanteCompliance.Api
   ```

2. **Configure environment variables** (see [Environment Variables](#environment-variables) below):
   ```bash
   cp appsettings.Development.json.example appsettings.Development.json
   ```
   Edit `appsettings.Development.json` with your local settings.

3. **Restore dependencies:**
   ```bash
   dotnet restore
   ```

4. **Apply database migrations:**
   ```bash
   dotnet ef database update --project ../AvanteCompliance.Infrastructure
   ```

5. **Run the backend:**
   ```bash
   dotnet run
   ```
   The API will start at `https://localhost:5001` (HTTPS) and `http://localhost:5000` (HTTP) by default.

### Frontend

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will start at `http://localhost:5173` by default.

5. **Build for production:**
   ```bash
   npm run build
   ```
   Output will be in the `frontend/dist/` directory.

## Environment Variables

### Backend (`appsettings.json` / Environment Variables)

| Variable | Description | Default | Required |
|---|---|---|---|
| `ConnectionStrings__DefaultConnection` | Database connection string | — | Yes |
| `Jwt__Secret` | JWT signing secret key (min 32 characters) | — | Yes |
| `Jwt__Issuer` | JWT token issuer | `AvanteCompliance` | No |
| `Jwt__Audience` | JWT token audience | `AvanteComplianceClient` | No |
| `Jwt__ExpirationInMinutes` | Token expiration time in minutes | `60` | No |
| `ASPNETCORE_ENVIRONMENT` | Runtime environment (`Development`, `Staging`, `Production`) | `Development` | No |
| `AllowedOrigins` | CORS allowed origins (comma-separated) | `http://localhost:5173` | No |

### Frontend (`.env` file)

| Variable | Description | Default | Required |
|---|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api` | Yes |
| `VITE_APP_TITLE` | Application display title | `Avante AI Compliance` | No |

> **Note:** All frontend environment variables must be prefixed with `VITE_` to be accessible via `import.meta.env`.

## API Endpoint Summary

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive JWT token |
| `POST` | `/api/auth/refresh` | Refresh an expired JWT token |

### Compliance

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/compliance/policies` | List all compliance policies |
| `GET` | `/api/compliance/policies/{id}` | Get a specific policy by ID |
| `POST` | `/api/compliance/policies` | Create a new compliance policy |
| `PUT` | `/api/compliance/policies/{id}` | Update an existing policy |
| `DELETE` | `/api/compliance/policies/{id}` | Delete a policy |

### Assessments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assessments` | List all compliance assessments |
| `GET` | `/api/assessments/{id}` | Get a specific assessment |
| `POST` | `/api/assessments` | Create a new assessment |
| `PUT` | `/api/assessments/{id}` | Update an assessment |
| `DELETE` | `/api/assessments/{id}` | Delete an assessment |
| `POST` | `/api/assessments/{id}/submit` | Submit an assessment for review |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports` | List all generated reports |
| `GET` | `/api/reports/{id}` | Get a specific report |
| `POST` | `/api/reports/generate` | Generate a new compliance report |
| `GET` | `/api/reports/{id}/download` | Download a report file |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users (admin only) |
| `GET` | `/api/users/{id}` | Get user profile |
| `PUT` | `/api/users/{id}` | Update user profile |
| `DELETE` | `/api/users/{id}` | Deactivate a user (admin only) |

> All endpoints except `/api/auth/register` and `/api/auth/login` require a valid JWT token in the `Authorization: Bearer <token>` header.

## Usage Guide

### Getting Started

1. **Register an account** by sending a `POST` request to `/api/auth/register` with your email and password.
2. **Log in** via `/api/auth/login` to receive a JWT token.
3. **Include the token** in subsequent requests using the `Authorization: Bearer <token>` header.
4. **Create compliance policies** to define your organization's compliance requirements.
5. **Run assessments** against policies to evaluate compliance status.
6. **Generate reports** to review and export compliance findings.

### Running Tests

**Backend tests:**
```bash
cd backend/tests/AvanteCompliance.Tests
dotnet test
```

**Frontend tests:**
```bash
cd frontend
npm run test
```

### Linting

**Frontend:**
```bash
cd frontend
npm run lint
```

## License

Private — All rights reserved. This software is proprietary and confidential. Unauthorized copying, distribution, or modification of this project is strictly prohibited.