# Negotiation Simulator

A full-stack web application for academic negotiation simulation with Claude API-powered bot, instructor configuration, and student review capabilities.

## Features

- **Browser-based text interface** with scenario-dependent prompts
- **Instructor view** for comprehensive negotiation setup
- **Student negotiation interface** with chat-based interaction
- **Multi-user support** (shared web app)
- **Instructor dashboard** to review student sessions
- **Pre-built scenario templates**
- **Configurable strategies, temperaments, difficulty, time limits, success criteria, and personalities**
- **Secure server-side Claude API key management**
- **Assignment system** with practice/exam types, deadlines, availability windows, and themes

## Tech Stack

**Frontend**: React + TypeScript + Vite + Tailwind CSS
**Backend**: Node.js + Express + TypeScript
**Database**: PostgreSQL with Prisma ORM
**AI**: Claude API (Sonnet 4.5) for negotiation responses and evaluation
**Auth**: JWT-based username/password authentication

## 🚀 Want to use this with your own class?

If you just want to deploy your own copy for your students — no coding required — see **[DEPLOYMENT.md](DEPLOYMENT.md)**, a step-by-step, non-technical-friendly guide (fork the repo, click through Railway and Vercel, done).

The rest of this README is for running the code locally, e.g. if you want to modify it.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Claude API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your actual values (`DATABASE_URL`, `JWT_SECRET`, and `CLAUDE_API_KEY` are required for the app to run; everything else in `.env.example` is optional — see the full reference table in [DEPLOYMENT.md](DEPLOYMENT.md#environment-variable-reference) for what each one does):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/negotiation_db
JWT_SECRET=your-secret-key-here-change-in-production
CLAUDE_API_KEY=your-claude-api-key
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

7. Seed the database with default templates:
```bash
npm run prisma:seed
```

There's no public sign-up page — only an instructor can create accounts, and only for (anonymous) students, from the Students page once logged in. So also create yourself an instructor login (username/password printed to the terminal):
```bash
npm run create-instructor
```

8. Start the development server:
```bash
npm run dev
```

The backend will run on http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Project Structure

```
negotiation-simulator/
├── backend/              # Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, validation middleware
│   │   ├── services/     # Business logic (auth, claude, session, assignment)
│   │   ├── routes/       # API routes
│   │   ├── prisma/       # Database schema and seed
│   │   └── utils/        # Utilities (JWT, validation)
│   └── package.json
├── frontend/             # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # API service
│   │   └── types/        # TypeScript types
│   └── package.json
├── shared/               # Shared types between frontend and backend
│   └── types/
└── README.md
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create new user account
- `POST /login` - Login and receive JWT token
- `GET /me` - Get current user info (requires auth)
- `POST /logout` - Invalidate token

### Configurations (`/api/configurations`)
- `GET /` - List all configurations
- `POST /` - Create new configuration (instructor only)
- `GET /:id` - Get configuration by ID
- `PUT /:id` - Update configuration (instructor only)
- `DELETE /:id` - Delete configuration (instructor only)
- `POST /:id/activate` - Set as active configuration

### Sessions (`/api/sessions`)
- `POST /start` - Start new negotiation session
- `GET /` - List sessions
- `GET /:id` - Get session by ID with full transcript
- `POST /:id/message` - Send message and get bot response
- `POST /:id/end` - End session and trigger evaluation
- `GET /active` - Get student's current active session

### Assignments (`/api/assignments`)
- `POST /` - Create assignment for student (instructor only)
- `GET /` - List assignments
- `GET /:id` - Get assignment by ID
- `PUT /:id` - Update assignment (instructor only)
- `DELETE /:id` - Delete assignment (instructor only)
- `POST /bulk` - Create bulk assignments (instructor only)

### Templates (`/api/templates`)
- `GET /` - List all default templates
- `GET /:id` - Get template by ID
- `POST /:id/use` - Create configuration from template (instructor only)

### Instructor Review (`/api/instructor`)
- `GET /sessions` - List all student sessions with filters
- `GET /sessions/:id` - Get detailed session view
- `GET /students` - Get list of all students

## Database Schema

The database includes the following main tables:

- **Users** - Student and instructor accounts
- **Configurations** - Negotiation scenarios with bot settings
- **Sessions** - Active and completed negotiation sessions
- **Assignments** - Instructor-assigned negotiations with deadlines
- **Templates** - Pre-built negotiation scenarios

See `backend/src/prisma/schema.prisma` for the complete schema.

## Pre-built Templates

The application comes with 5 pre-built negotiation scenarios:

1. **Salary Negotiation** - Job offer negotiation
2. **Vendor Contract** - Software licensing negotiation
3. **Conflict Resolution** - Team disagreement resolution
4. **Budget Negotiation** - Department resource allocation
5. **Partnership Negotiation** - Win-win collaboration

## Future Enhancements

- Two-way voice integration (architecture already supports this)
- Real-time collaboration
- Advanced analytics dashboard
- LMS integration
- Mobile app
- AI-powered coaching suggestions

## License

MIT
