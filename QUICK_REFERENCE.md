# Negotiation Simulator - Quick Reference

## Installation & Setup

```bash
# Clone/navigate to project
cd negotiation-simulator

# Run automated setup
./setup.sh

# Or manual setup:
cd backend && npm install && npm run prisma:migrate && npm run prisma:seed
cd ../frontend && npm install
```

## Running the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Access at http://localhost:5173
```

## Common Tasks

### Create a New Template

Edit `backend/src/prisma/seed.ts`:

```typescript
{
  name: 'Your Template Name',
  description: 'Description here',
  configuration: {
    scenario: '...',
    context: '...',
    botStrategy: 'collaborative', // or competitive, analytical, emotional
    temperament: 5, // 1-10
    difficulty: 'medium', // easy, medium, hard, expert
    timeLimit: 15, // minutes, 0 = unlimited
    successCriteria: ['Criterion 1', 'Criterion 2'],
    personality: {
      formality: 'professional', // casual, professional, formal
      emotionalResponsiveness: 'medium', // low, medium, high
      communicationStyle: 'direct' // direct, indirect, diplomatic
    }
  }
}
```

Then run:
```bash
npm run prisma:seed
```

### Add a New API Endpoint

1. Create controller method in `backend/src/controllers/`
2. Add route in `backend/src/routes/`
3. Register route in `backend/src/server.ts`
4. Add API method in `frontend/src/services/api.service.ts`

### Add a New Page

1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link in `frontend/src/components/Layout/Header.tsx`

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/negotiation_db
JWT_SECRET=your-secret-key-here
CLAUDE_API_KEY=sk-ant-your-api-key
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Database Commands

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio (database GUI)
npx prisma studio
```

## API Endpoints Quick Reference

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- POST `/api/auth/logout` - Logout

### Configurations (Instructor only)
- GET `/api/configurations` - List all
- POST `/api/configurations` - Create new
- GET `/api/configurations/:id` - Get one
- PUT `/api/configurations/:id` - Update
- DELETE `/api/configurations/:id` - Delete
- POST `/api/configurations/:id/activate` - Set as active

### Sessions (Student)
- POST `/api/sessions/start` - Start new session
  ```json
  { "configurationId": "uuid", "assignmentId": "uuid" }
  ```
- POST `/api/sessions/:id/message` - Send message
  ```json
  { "message": "Your message" }
  ```
- POST `/api/sessions/:id/end` - End session
- GET `/api/sessions` - List all sessions
- GET `/api/sessions/active` - Get active session

### Assignments
- GET `/api/assignments` - List (filtered by role)
- POST `/api/assignments` - Create one
- POST `/api/assignments/bulk` - Create for multiple students
- PUT `/api/assignments/:id` - Update
- DELETE `/api/assignments/:id` - Delete

### Templates
- GET `/api/templates` - List all
- GET `/api/templates/:id` - Get one
- POST `/api/templates/:id/use` - Create config from template

### Instructor
- GET `/api/instructor/sessions` - Get all student sessions
- GET `/api/instructor/students` - Get all students

## Bot Strategies

### Collaborative
- Seeks win-win solutions
- Open to creative problem-solving
- Values relationship

### Competitive
- Maximizes own gain
- Firm on positions
- Uses leverage strategically

### Analytical
- Focuses on data and logic
- Requires well-reasoned proposals
- Evidence-driven

### Emotional
- Influenced by rapport
- Responds to empathy
- Relationship-focused

## Difficulty Levels

- **Easy**: Flexible, makes concessions easily
- **Medium**: Moderately firm, requires substantive arguments
- **Hard**: Very firm, requires strong justification
- **Expert**: Experienced negotiator, high standards

## Temperament Scale (1-10)

- 1-3: Calm, measured, accommodating
- 4-6: Balanced assertiveness and flexibility
- 7-10: Assertive, stands firm, pushes back

## Personality Settings

### Formality
- `casual`: Informal, friendly
- `professional`: Business-appropriate
- `formal`: Very formal, structured

### Emotional Responsiveness
- `low`: Reserved, professional
- `medium`: Balanced
- `high`: Expressive, empathetic

### Communication Style
- `direct`: Straightforward, clear
- `indirect`: Subtle, nuanced
- `diplomatic`: Tactful, considerate

## Assignment Types

### Practice
- Students can retry
- Lower stakes
- Focus on learning

### Exam
- Single attempt
- Higher stakes
- Graded performance

## Session Outcome Types

- `success`: All/most criteria met
- `partial`: Some criteria met
- `failure`: Few/no criteria met
- `timeout`: Time limit reached

## Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Check environment variables
cat backend/.env

# Regenerate Prisma client
cd backend && npm run prisma:generate
```

### Frontend errors
```bash
# Clear and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database connection issues
```bash
# Test connection
psql "postgresql://user:pass@localhost:5432/negotiation_db"

# Recreate database
dropdb negotiation_db
createdb negotiation_db
npm run prisma:migrate
```

### Claude API errors
- Check API key in `.env`
- Verify API credits
- Check internet connection
- Review rate limits

## Development Tips

1. **Use Prisma Studio** for database inspection: `npx prisma studio`
2. **Check backend logs** for errors in the terminal
3. **Use browser DevTools** to inspect network requests
4. **Enable React DevTools** for component debugging
5. **Use hot reload** - changes auto-refresh in dev mode

## Code Style

- Backend: Express REST API pattern
- Frontend: React functional components with hooks
- State: React Context API
- Styling: Tailwind CSS utility classes
- Types: TypeScript throughout

## File Naming Conventions

- Components: PascalCase (e.g., `ChatInterface.tsx`)
- Services: camelCase.service (e.g., `auth.service.ts`)
- Contexts: PascalCaseContext (e.g., `AuthContext.tsx`)
- Routes: kebab-case.routes (e.g., `auth.routes.ts`)
- Types: lowercase (e.g., `negotiation.ts`)

## Performance Best Practices

1. Use React.memo() for expensive components
2. Implement pagination for large lists
3. Add loading states for async operations
4. Cache API responses when appropriate
5. Use database indexes for frequent queries

## Security Checklist

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens for authentication
- ✅ Role-based access control
- ✅ API key on server only
- ✅ Input validation
- ✅ Rate limiting
- ✅ CORS configured
- ⚠️ Add HTTPS in production
- ⚠️ Add CSP headers in production
- ⚠️ Use environment-specific secrets

## Useful Commands

```bash
# Backend
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Run production build

# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npx prisma studio    # Open database GUI
npx prisma migrate dev --name name  # Create migration
npx prisma db seed   # Run seed file

# Format code
npm run format       # If configured

# Lint code
npm run lint         # If configured
```

## Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Claude API](https://docs.anthropic.com)
- [TypeScript](https://www.typescriptlang.org)

## Support

For issues:
1. Check logs in both terminals
2. Verify environment variables
3. Ensure PostgreSQL is running
4. Check that ports 3001 and 5173 are free
5. Review SETUP.md for detailed troubleshooting
