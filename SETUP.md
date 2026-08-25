# Negotiation Simulator - Setup Guide

> **Deploying this for your own class online?** See [DEPLOYMENT.md](DEPLOYMENT.md) instead — a step-by-step guide with no coding required. This page is for running the code on your own computer, e.g. to modify it.

## Quick Start

This guide will help you get the Negotiation Simulator up and running.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ and npm
- PostgreSQL 12+
- Claude API key (from Anthropic)

## Step 1: Database Setup

### Install PostgreSQL (if not already installed)

**macOS** (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian**:
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE negotiation_db;
CREATE USER negotiation_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE negotiation_db TO negotiation_user;
\q
```

## Step 2: Backend Setup

1. Navigate to the backend directory:
```bash
cd negotiation-simulator/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your actual values:
```env
DATABASE_URL=postgresql://negotiation_user:your_password@localhost:5432/negotiation_db
JWT_SECRET=generate-a-random-secret-here
CLAUDE_API_KEY=sk-ant-your-claude-api-key
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

To generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

7. Seed the database with templates:
```bash
npm run prisma:seed
```

There's no public sign-up page — only an instructor can create accounts, and only for (anonymous) students, from the Students page once logged in. So also create yourself an instructor login (username/password printed to the terminal):
```bash
npm run create-instructor
```

8. Start the backend server:
```bash
npm run dev
```

The backend should now be running on http://localhost:3001

## Step 3: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd negotiation-simulator/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend should now be running on http://localhost:5173

## Step 4: Test the Application

1. Open your browser and go to http://localhost:5173

2. Log in with the instructor account `create-instructor` printed for you above.

3. As instructor:
   - Browse to Templates and create a configuration
   - Go to the Students page and click **Create Student** — this generates an anonymous username and a password for you to hand to a real (or test) student
   - Create an assignment for that student
   - Review sessions after the student completes one

   Open a private/incognito window and log in as the student you just created to try the flow below.

4. As student:
   - View your assignments
   - Start a negotiation
   - Chat with the AI bot
   - Complete the session and view results

## Troubleshooting

### Database Connection Issues

If you get connection errors:

1. Check PostgreSQL is running:
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

2. Verify database exists:
```bash
psql postgres -c "\l"
```

3. Test connection string:
```bash
psql "postgresql://negotiation_user:your_password@localhost:5432/negotiation_db"
```

### Backend Won't Start

1. Check all environment variables are set in `.env`
2. Ensure PostgreSQL is running
3. Verify Node.js version: `node --version` (should be 18+)
4. Check logs for specific errors

### Frontend Won't Start

1. Verify backend is running on port 3001
2. Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Claude API Errors

1. Verify your API key is correct in `.env`
2. Check your API key has sufficient credits
3. Ensure you're using the correct model (claude-sonnet-4-5-20250929)

## Production Deployment

For putting this online (Railway + Vercel, no server management required), see **[DEPLOYMENT.md](DEPLOYMENT.md)** — it also has the full environment variable reference for every variable the app reads, required and optional.

## Next Steps

- Read the main README.md for architecture details
- Explore the pre-built templates
- Create custom negotiation scenarios
- Assign negotiations to students
- Review student performance

## Getting Help

If you encounter issues:

1. Check the logs in both frontend and backend terminals
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Check that ports 3001 and 5173 are not in use by other applications

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique JWT secrets in production
- Keep your Claude API key secure
- Use HTTPS in production
- Implement rate limiting and additional security measures for production deployments
