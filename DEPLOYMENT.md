# Deployment Guide — Avante AI Compliance

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment](#backend-deployment)
5. [PostgreSQL Setup](#postgresql-setup)
6. [Environment Variable Configuration](#environment-variable-configuration)
7. [EF Core Migrations](#ef-core-migrations)
8. [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
9. [Production Checklist](#production-checklist)

---

## Architecture Overview

| Layer    | Technology                        | Hosting                          |
|----------|-----------------------------------|----------------------------------|
| Frontend | React 18 + Vite (SPA)            | Vercel                           |
| Backend  | ASP.NET Core 9 Web API (C# 12+)  | Azure App Service / AWS ECS / VPS |
| Database | PostgreSQL 16+                    | Azure Database / AWS RDS / Self-hosted |

---

## Prerequisites

- **Node.js** 20 LTS or later
- **.NET SDK** 9.0 or later
- **PostgreSQL** 16 or later
- **Git** 2.40+
- **Vercel CLI** (`npm i -g vercel`) — for frontend deployment
- **EF Core CLI** (`dotnet tool install --global dotnet-ef`) — for migrations
- **Docker** (optional, for containerized deployments)

---

## Frontend Deployment (Vercel)

### 1. Project Configuration

Create `frontend/vercel.json` at the root of the frontend project:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### 2. SPA Routing

The `rewrites` rule above ensures that all client-side routes (e.g., `/dashboard`, `/reports/123`) are served by `index.html`. This is critical for React Router to function correctly in production.

### 3. Deploy via Vercel CLI

```bash
cd frontend
vercel --prod
```

### 4. Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and import the GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. Set the **Framework Preset** to `Vite`.
4. Add environment variables (see [Environment Variable Configuration](#environment-variable-configuration)).
5. Click **Deploy**.

### 5. Custom Domain

```bash
vercel domains add yourdomain.com
```

Configure DNS records as instructed by Vercel. SSL is provisioned automatically.

---

## Backend Deployment

### Option A: Azure App Service

```bash
# Publish the project
cd backend
dotnet publish -c Release -o ./publish

# Deploy using Azure CLI
az webapp create --resource-group avante-rg --plan avante-plan --name avante-api --runtime "DOTNETCORE:9.0"
az webapp deploy --resource-group avante-rg --name avante-api --src-path ./publish --type zip
```

Configure the following App Service settings:

- **ASPNETCORE_ENVIRONMENT** = `Production`
- **ConnectionStrings__DefaultConnection** = your PostgreSQL connection string
- All other environment variables listed in the configuration section below

### Option B: AWS ECS (Docker)

Create `backend/Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["AvanteAiCompliance.Api/AvanteAiCompliance.Api.csproj", "AvanteAiCompliance.Api/"]
RUN dotnet restore "AvanteAiCompliance.Api/AvanteAiCompliance.Api.csproj"
COPY . .
WORKDIR "/src/AvanteAiCompliance.Api"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "AvanteAiCompliance.Api.dll"]
```

Build and push:

```bash
docker build -t avante-api -f backend/Dockerfile backend/
docker tag avante-api:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/avante-api:latest
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/avante-api:latest
```

### Option C: Linux VPS (systemd)

```bash
# On the server
cd /opt/avante-api
dotnet publish -c Release -o ./publish

# Create systemd service
sudo tee /etc/systemd/system/avante-api.service > /dev/null <<EOF
[Unit]
Description=Avante AI Compliance API
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/avante-api/publish
ExecStart=/usr/bin/dotnet /opt/avante-api/publish/AvanteAiCompliance.Api.dll
Restart=always
RestartSec=10
SyslogIdentifier=avante-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000
EnvironmentFile=/opt/avante-api/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable avante-api
sudo systemctl start avante-api
```

Use **nginx** or **Caddy** as a reverse proxy with TLS termination in front of the Kestrel server.

---

## PostgreSQL Setup

### 1. Create the Database

```sql
-- Connect as the postgres superuser
CREATE USER avante_app WITH PASSWORD '<strong-password-here>';
CREATE DATABASE avante_compliance OWNER avante_app;

-- Connect to the new database
\c avante_compliance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2. Connection String Format

```
Host=<host>;Port=5432;Database=avante_compliance;Username=avante_app;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

### 3. Connection Pooling (Production)

For production workloads, use **PgBouncer** or the built-in Npgsql connection pooling:

```
Host=<host>;Port=5432;Database=avante_compliance;Username=avante_app;Password=<password>;SSL Mode=Require;Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;Connection Idle Lifetime=300
```

### 4. Backups

Set up automated daily backups:

```bash
# Add to crontab
0 2 * * * pg_dump -U avante_app -h localhost avante_compliance | gzip > /backups/avante_compliance_$(date +\%Y\%m\%d).sql.gz
```

For managed services (Azure/AWS), enable automated backups with at least 7-day retention.

---

## Environment Variable Configuration

### Backend (`appsettings.Production.json` or environment variables)

| Variable | Description | Example |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=db.example.com;Port=5432;Database=avante_compliance;...` |
| `ASPNETCORE_ENVIRONMENT` | Runtime environment | `Production` |
| `Jwt__SecretKey` | JWT signing key (min 256-bit) | `<base64-encoded-secret>` |
| `Jwt__Issuer` | JWT token issuer | `https://api.yourdomain.com` |
| `Jwt__Audience` | JWT token audience | `https://yourdomain.com` |
| `Jwt__ExpirationMinutes` | Token expiration in minutes | `60` |
| `Cors__AllowedOrigins` | Comma-separated allowed origins | `https://yourdomain.com` |
| `Logging__LogLevel__Default` | Default log level | `Warning` |
| `AiService__ApiKey` | AI provider API key | `sk-...` |
| `AiService__Endpoint` | AI provider endpoint URL | `https://api.openai.com/v1` |
| `AiService__Model` | AI model identifier | `gpt-4o` |

### Frontend (Vercel / `.env.production`)

All frontend environment variables **must** be prefixed with `VITE_`.

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `https://api.yourdomain.com` |
| `VITE_APP_NAME` | Application display name | `Avante AI Compliance` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `true` |

Set these in Vercel under **Project Settings → Environment Variables** or in a `.env.production` file (never commit secrets to the repository).

### Generating a Secure JWT Key

```bash
openssl rand -base64 64
```

---

## EF Core Migrations

### Initial Setup

```bash
cd backend/AvanteAiCompliance.Api

# Install EF Core tools (if not already installed)
dotnet tool install --global dotnet-ef

# Create the initial migration
dotnet ef migrations add InitialCreate --project ../AvanteAiCompliance.Infrastructure --startup-project .

# Apply migrations to the database
dotnet ef database update --project ../AvanteAiCompliance.Infrastructure --startup-project .
```

### Adding New Migrations

```bash
# After modifying entity classes
dotnet ef migrations add <MigrationName> --project ../AvanteAiCompliance.Infrastructure --startup-project .

# Review the generated migration file before applying
# Located at: AvanteAiCompliance.Infrastructure/Migrations/<timestamp>_<MigrationName>.cs

# Apply to development database
dotnet ef database update --project ../AvanteAiCompliance.Infrastructure --startup-project .
```

### Production Migration Strategies

**Option 1: Generate SQL Script (Recommended for Production)**

```bash
# Generate an idempotent SQL script
dotnet ef migrations script --idempotent --project ../AvanteAiCompliance.Infrastructure --startup-project . -o migrate.sql

# Review the script, then apply manually
psql -U avante_app -d avante_compliance -f migrate.sql
```

**Option 2: Apply on Startup (Use with Caution)**

In `Program.cs`, apply pending migrations at startup. Only recommended for single-instance deployments:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
}
```

**Option 3: Bundle Migrations**

```bash
dotnet ef migrations bundle --project ../AvanteAiCompliance.Infrastructure --startup-project . -o efbundle

# Run the bundle on the production server
./efbundle --connection "<production-connection-string>"
```

### Rolling Back Migrations

```bash
# Revert to a specific migration
dotnet ef database update <PreviousMigrationName> --project ../AvanteAiCompliance.Infrastructure --startup-project .

# Remove the last migration (if not yet applied)
dotnet ef migrations remove --project ../AvanteAiCompliance.Infrastructure --startup-project .
```

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DOTNET_VERSION: "9.0.x"
  NODE_VERSION: "20"

jobs:
  # ──────────────────────────────────────────────
  # Backend: Build, Test, Publish
  # ──────────────────────────────────────────────
  backend-build:
    name: Backend Build & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: avante_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready -U test_user"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --configuration Release --no-restore

      - name: Run tests
        run: dotnet test --configuration Release --no-build --verbosity normal --collect:"XPlat Code Coverage"
        env:
          ConnectionStrings__DefaultConnection: "Host=localhost;Port=5432;Database=avante_test;Username=test_user;Password=test_password"

      - name: Publish
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: dotnet publish AvanteAiCompliance.Api/AvanteAiCompliance.Api.csproj --configuration Release --output ./publish

      - name: Upload build artifact
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        uses: actions/upload-artifact@v4
        with:
          name: backend-publish
          path: backend/publish
          retention-days: 7

  # ──────────────────────────────────────────────
  # Frontend: Build, Test, Deploy to Vercel
  # ──────────────────────────────────────────────
  frontend-build:
    name: Frontend Build & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm run test -- --run

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}

  # ──────────────────────────────────────────────
  # Deploy Frontend to Vercel
  # ──────────────────────────────────────────────
  deploy-frontend:
    name: Deploy Frontend (Vercel)
    needs: [frontend-build, backend-build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Pull Vercel environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend

      - name: Build for Vercel
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: frontend

  # ──────────────────────────────────────────────
  # Deploy Backend
  # ──────────────────────────────────────────────
  deploy-backend:
    name: Deploy Backend
    needs: [frontend-build, backend-build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: backend-publish
          path: ./publish

      # ── Azure App Service deployment ──
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.AZURE_APP_NAME }}
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: ./publish

  # ──────────────────────────────────────────────
  # Database Migrations
  # ──────────────────────────────────────────────
  run-migrations:
    name: Run Database Migrations
    needs: [backend-build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Install EF Core tools
        run: dotnet tool install --global dotnet-ef

      - name: Generate migration script
        run: |
          cd backend
          dotnet ef migrations script --idempotent \
            --project AvanteAiCompliance.Infrastructure/AvanteAiCompliance.Infrastructure.csproj \
            --startup-project AvanteAiCompliance.Api/AvanteAiCompliance.Api.csproj \
            --output ../migrate.sql

      - name: Apply migrations
        run: |
          PGPASSWORD=${{ secrets.DB_PASSWORD }} psql \
            -h ${{ secrets.DB_HOST }} \
            -U ${{ secrets.DB_USERNAME }} \
            -d ${{ secrets.DB_NAME }} \
            -f migrate.sql
```

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Vercel personal access token |
| `AZURE_PUBLISH_PROFILE` | Azure App Service publish profile XML |
| `DB_HOST` | Production PostgreSQL host |
| `DB_USERNAME` | Production database username |
| `DB_PASSWORD` | Production database password |
| `DB_NAME` | Production database name |

### Required GitHub Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Production API URL |
| `AZURE_APP_NAME` | Azure App Service name |

---

## Production Checklist

### Security

- [ ] **HTTPS enforced** on both frontend and backend
- [ ] **JWT secret key** is at least 256 bits and stored securely (not in source control)
- [ ] **CORS** is configured to allow only the production frontend origin
- [ ] **Rate limiting** is enabled on the API (e.g., `AspNetCoreRateLimit` or built-in .NET 9 rate limiter)
- [ ] **Input validation** is applied on all API endpoints
- [ ] **SQL injection** protection verified (parameterized queries via EF Core)
- [ ] **Security headers** configured (X-Content-Type-Options, X-Frame-Options, CSP, etc.)
- [ ] **API keys and secrets** are stored in environment variables or a secrets manager (Azure Key Vault, AWS Secrets Manager)
- [ ] **Dependency vulnerabilities** scanned (`dotnet list package --vulnerable`, `npm audit`)
- [ ] **Authentication tokens** have appropriate expiration times
- [ ] **HSTS** is enabled with a minimum max-age of 1 year

### Database

- [ ] **Connection pooling** is configured with appropriate min/max pool sizes
- [ ] **Automated backups** are enabled with at least 7-day retention
- [ ] **Point-in-time recovery** is enabled (managed services)
- [ ] **Database migrations** have been tested against a staging environment
- [ ] **Indexes** are created for frequently queried columns
- [ ] **SSL/TLS** is required for database connections
- [ ] **Database user** has minimal required permissions (no superuser)

### Performance

- [ ] **Frontend assets** are minified and gzip/brotli compressed
- [ ] **Static assets** have long-lived cache headers (`Cache-Control: immutable`)
- [ ] **API response caching** is configured where appropriate
- [ ] **Database query performance** has been profiled (no N+1 queries)
- [ ] **Health check endpoint** is configured (`/health` or `/api/health`)
- [ ] **Connection timeouts** are set appropriately

### Monitoring & Logging

- [ ] **Structured logging** is configured (Serilog or built-in .NET logging with JSON output)
- [ ] **Application Performance Monitoring** is set up (Application Insights, Datadog, or similar)
- [ ] **Error tracking** is configured (Sentry, Application Insights, or similar)
- [ ] **Uptime monitoring** is configured for both frontend and backend
- [ ] **Log retention policy** is defined (30+ days recommended)
- [ ] **Alerting** is configured for error rate spikes, high latency, and downtime

### Infrastructure

- [ ] **Auto-scaling** is configured for the backend (if applicable)
- [ ] **Load balancer** health checks are configured
- [ ] **DNS** is configured with appropriate TTL values
- [ ] **SSL certificates** auto-renew (Let's Encrypt or managed certificates)
- [ ] **Firewall rules** restrict database access to application servers only
- [ ] **Environment parity** — staging environment mirrors production configuration

### Compliance & Data

- [ ] **Data encryption at rest** is enabled for the database
- [ ] **Data encryption in transit** (TLS 1.2+) for all connections
- [ ] **Audit logging** is enabled for sensitive operations
- [ ] **Data retention policies** are implemented and documented
- [ ] **GDPR/privacy requirements** are addressed (if applicable)
- [ ] **Backup restoration** has been tested successfully

### Deployment Process

- [ ] **CI/CD pipeline** passes all stages (build, test, deploy)
- [ ] **Rollback procedure** is documented and tested
- [ ] **Blue-green or canary deployment** strategy is in place (recommended)
- [ ] **Database migration rollback** procedure is documented
- [ ] **Smoke tests** run after each deployment
- [ ] **Deployment notifications** are sent to the team (Slack, Teams, email)

---

## Troubleshooting

### Frontend returns 404 on page refresh

Ensure the Vercel `rewrites` rule is configured to redirect all routes to `/index.html`. See the [SPA Routing](#2-spa-routing) section.

### Backend cannot connect to PostgreSQL

1. Verify the connection string format and credentials.
2. Ensure the database server allows connections from the backend's IP address.
3. Check that SSL mode is configured correctly (`SSL Mode=Require` for managed services).
4. Verify the PostgreSQL service is running: `pg_isready -h <host> -p 5432`.

### EF Core migration fails

1. Ensure the `dotnet-ef` tool version matches the project's EF Core package version.
2. Verify the startup project can build successfully: `dotnet build`.
3. Check that the `DbContext` is registered in the DI container.
4. For "relation already exists" errors, use `--idempotent` flag when generating scripts.

### CORS errors in production

1. Verify `Cors__AllowedOrigins` includes the exact frontend URL (including protocol, no trailing slash).
2. Ensure the CORS middleware is added before authentication middleware in `Program.cs`.
3. Check that preflight `OPTIONS` requests are handled correctly.

---

## Support

For deployment issues, contact the DevOps team or open an issue in the repository with the `deployment` label.