# Negotiation Simulator - Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                │
│                   React + TypeScript + Vite                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Student    │  │  Instructor  │  │     Auth     │          │
│  │     View     │  │     View     │  │     View     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │           React Contexts (State)                  │          │
│  │  Auth │ Session │ Config │ Assignment            │          │
│  └──────────────────────────────────────────────────┘          │
│         │                  │                  │                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │              API Service Layer                    │          │
│  └──────────────────────────────────────────────────┘          │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTP/REST
                            │ (fetch API)
┌───────────────────────────┼──────────────────────────────────────┐
│                           │                                      │
│  ┌────────────────────────▼───────────────────────────┐         │
│  │              Express Server                        │         │
│  │              (Port 3001)                           │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Middleware Layer                        │   │
│  │  • CORS        • Rate Limiting                          │   │
│  │  • Auth (JWT)  • Validation                             │   │
│  │  • Role Check  • Error Handling                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Route Layer                            │   │
│  │  /auth  /configs  /sessions  /assignments  /templates   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Controller Layer                         │   │
│  │  Handle requests, coordinate services, send responses   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Service Layer                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │   Auth   │  │  Claude  │  │ Session  │             │   │
│  │  │  Service │  │  Service │  │ Service  │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐                                           │   │
│  │  │Assignment│       Business Logic Layer               │   │
│  │  │  Service │                                           │   │
│  │  └──────────┘                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│            │                    │                                │
│            │                    │                                │
│  ┌─────────▼──────┐  ┌─────────▼───────────┐                  │
│  │     Prisma     │  │   Claude API        │                  │
│  │      ORM       │  │   (External)        │                  │
│  └─────────┬──────┘  └─────────────────────┘                  │
│            │                                                     │
└────────────┼─────────────────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ Users  │ │Configs │ │Sessions│ │Assignm.│ │Templates│       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Student Negotiation Flow

```
┌─────────┐
│ Student │
└────┬────┘
     │ 1. Start Session (configId, assignmentId)
     ▼
┌─────────────────┐
│ Session Service │
└────┬────────────┘
     │ 2. Create session record
     ▼
┌──────────────┐
│  Database    │
└────┬─────────┘
     │ 3. Generate initial bot message
     ▼
┌──────────────┐
│ Claude API   │
└────┬─────────┘
     │ 4. Return bot greeting
     ▼
┌─────────┐
│ Student │ ◄─── Session with initial message
└────┬────┘
     │ 5. Send user message
     ▼
┌─────────────────┐
│ Session Service │
└────┬────────────┘
     │ 6. Append to transcript
     ▼
┌──────────────┐
│  Database    │
└────┬─────────┘
     │ 7. Generate bot response
     ▼
┌──────────────┐
│ Claude API   │
└────┬─────────┘
     │ 8. Return bot message
     ▼
┌─────────┐
│ Student │ ◄─── Updated transcript
└────┬────┘
     │ 9. End session
     ▼
┌─────────────────┐
│ Session Service │
└────┬────────────┘
     │ 10. Evaluate session
     ▼
┌──────────────┐
│ Claude API   │
└────┬─────────┘
     │ 11. Return evaluation
     ▼
┌──────────────┐
│  Database    │ ◄─── Store outcome
└────┬─────────┘
     │ 12. Return results
     ▼
┌─────────┐
│ Student │ ◄─── Session outcome
└─────────┘
```

### Instructor Assignment Creation Flow

```
┌────────────┐
│ Instructor │
└─────┬──────┘
      │ 1. Create configuration
      ▼
┌─────────────────┐
│ Config Service  │
└─────┬───────────┘
      │ 2. Save to database
      ▼
┌──────────────┐
│  Database    │
└─────┬────────┘
      │ 3. Create assignment
      ▼
┌────────────┐
│ Instructor │
└─────┬──────┘
      │ 4. Select students
      ▼
┌──────────────────┐
│ Assignment Service│
└─────┬────────────┘
      │ 5. Bulk create assignments
      ▼
┌──────────────┐
│  Database    │
└─────┬────────┘
      │ 6. Confirm creation
      ▼
┌────────────┐
│ Instructor │ ◄─── Assignments created
└────────────┘

┌─────────┐
│ Student │ ◄─── Can now see assignments
└─────────┘
```

## Component Hierarchy

### Frontend Components

```
App
├── AuthProvider
│   ├── ConfigProvider
│   │   ├── SessionProvider
│   │   │   └── AssignmentProvider
│   │   │       ├── Router
│   │   │       │   ├── LoginForm
│   │   │       │   ├── RegisterForm
│   │   │       │   ├── ProtectedRoute (Instructor)
│   │   │       │   │   ├── Header
│   │   │       │   │   └── InstructorDashboard
│   │   │       │   └── ProtectedRoute (Student)
│   │   │       │       ├── Header
│   │   │       │       ├── StudentDashboard
│   │   │       │       └── ChatInterface
```

## Database Schema Relationships

```
┌──────────┐
│  Users   │
│ (id, PK) │
└────┬─────┘
     │ 1:N
     ├─────────────────────────────────┐
     │                                  │
     │                                  │
┌────▼──────────┐              ┌───────▼────────┐
│Configurations │              │  Assignments   │
│   (id, PK)    │◄─────────────┤(configId, FK)  │
│(instructorId, │      1:N     │ (studentId,FK) │
│      FK)      │              │(instructorId,  │
└────┬──────────┘              │      FK)       │
     │ 1:N                     └───────┬────────┘
     │                                 │ 1:N
┌────▼──────────┐                     │
│   Sessions    │◄────────────────────┘
│   (id, PK)    │
│(configId, FK) │
│(studentId,FK) │
│(assignmentId, │
│   FK, NULL)   │
└───────────────┘

┌──────────┐
│Templates │ (No FK relationships)
│ (id, PK) │
└──────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────┐
│               Security Layers                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Network Layer                               │
│     • CORS (allowed origins only)               │
│     • Rate Limiting (60 req/min)                │
│     • HTTPS (production)                        │
│                                                  │
│  2. Authentication Layer                        │
│     • JWT tokens (24h expiry)                   │
│     • bcrypt password hashing (10 rounds)       │
│     • Token in Authorization header             │
│                                                  │
│  3. Authorization Layer                         │
│     • Role-based access control                 │
│     • Route-level protection                    │
│     • Resource ownership checks                 │
│                                                  │
│  4. Input Validation Layer                      │
│     • Request body validation                   │
│     • Type checking                             │
│     • Sanitization                              │
│                                                  │
│  5. Data Layer                                  │
│     • Parameterized queries (Prisma)            │
│     • No raw SQL                                │
│     • Cascade deletes                           │
│                                                  │
│  6. API Key Protection                          │
│     • Server-side only (never exposed)          │
│     • Environment variables                     │
│     • No client access                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

## API Request/Response Flow

```
Client Request
      │
      ▼
┌─────────────┐
│    CORS     │ ─── Check origin
└─────┬───────┘
      ▼
┌─────────────┐
│Rate Limiter │ ─── Check request count
└─────┬───────┘
      ▼
┌─────────────┐
│    Auth     │ ─── Verify JWT token
│ Middleware  │
└─────┬───────┘
      ▼
┌─────────────┐
│    Role     │ ─── Check user role
│ Middleware  │
└─────┬───────┘
      ▼
┌─────────────┐
│ Validation  │ ─── Validate request body
│ Middleware  │
└─────┬───────┘
      ▼
┌─────────────┐
│ Controller  │ ─── Handle business logic
└─────┬───────┘
      ▼
┌─────────────┐
│  Service    │ ─── Execute operations
└─────┬───────┘
      ▼
┌─────────────┐
│  Database   │ ─── Persist/retrieve data
└─────┬───────┘
      ▼
Response to Client
```

## Technology Stack Details

### Backend Stack
```
┌──────────────────────────────────────┐
│ Runtime: Node.js 18+                 │
│ Framework: Express.js 4.x            │
│ Language: TypeScript 5.x             │
│ ORM: Prisma 5.x                      │
│ Database: PostgreSQL 12+             │
│ Auth: JWT + bcrypt                   │
│ AI: Claude API (Sonnet 4.5)         │
│ Validation: Custom middleware        │
│ Rate Limiting: express-rate-limit    │
└──────────────────────────────────────┘
```

### Frontend Stack
```
┌──────────────────────────────────────┐
│ Runtime: Node.js 18+ (dev)           │
│ Framework: React 18                  │
│ Language: TypeScript 5.x             │
│ Build Tool: Vite 5.x                 │
│ Styling: Tailwind CSS 3.x            │
│ Routing: React Router 6              │
│ State: React Context API             │
│ HTTP Client: fetch API               │
└──────────────────────────────────────┘
```

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────┐
│                  CDN                             │
│          (Static assets)                         │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│              Load Balancer                       │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  Frontend      │    │   Frontend      │
│  (Nginx)       │    │   (Nginx)       │
└───────┬────────┘    └────────┬────────┘
        │                      │
        └──────────┬───────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│             API Gateway                          │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐  ┌────────▼────────┐
│   Backend      │  │   Backend       │
│   (Node.js)    │  │   (Node.js)     │
└───────┬────────┘  └────────┬────────┘
        │                    │
        └──────────┬─────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│        PostgreSQL (Primary + Replica)            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│             External Services                     │
│  • Claude API (Anthropic)                        │
│  • File Storage (S3) - for future voice files   │
│  • Monitoring (Datadog, etc.)                    │
│  • Logging (CloudWatch, etc.)                    │
└──────────────────────────────────────────────────┘
```

## Scalability Considerations

1. **Horizontal Scaling**: Stateless backend allows multiple instances
2. **Database**: Read replicas for session review queries
3. **Caching**: Redis for session data (future enhancement)
4. **CDN**: Static assets served from edge locations
5. **API**: Rate limiting prevents abuse
6. **Queue**: Background job processing for evaluations (future)

## Performance Optimizations

- Prisma query optimization with includes
- React.memo for expensive components
- Lazy loading for routes
- Database indexes on foreign keys
- Connection pooling in Prisma
- Pagination for large datasets (future)

## Monitoring Points

1. API endpoint response times
2. Database query performance
3. Claude API latency
4. Error rates by endpoint
5. User session durations
6. Assignment completion rates
7. System resource usage
