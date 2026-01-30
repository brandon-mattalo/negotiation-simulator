# Negotiation Simulator - Setup Guide

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

2. Register a new account:
   - Click "Register"
   - Create an instructor account
   - Create a student account (in another browser or incognito window)

3. As instructor:
   - Browse to Templates and create a configuration
   - Create an assignment for the student
   - Review sessions after student completes

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

### Backend

1. Build the backend:
```bash
cd backend
npm run build
```

2. Set environment to production:
```env
NODE_ENV=production
```

3. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start dist/server.js --name negotiation-backend
```

### Frontend

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Serve the dist folder with a web server (nginx, Apache, etc.)

Or serve from the backend:
```javascript
// In server.ts
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
```

### Database

1. Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
2. Update DATABASE_URL in production environment
3. Run migrations:
```bash
npm run prisma:migrate
```

## Environment Variables Reference

### Backend (.env)

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens (keep secure!)
- `CLAUDE_API_KEY`: Your Claude API key from Anthropic
- `NODE_ENV`: 'development' or 'production'
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

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
