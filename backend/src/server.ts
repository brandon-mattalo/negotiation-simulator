import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import configRoutes from './routes/config.routes';
import sessionRoutes from './routes/session.routes';
import assignmentRoutes from './routes/assignment.routes';
import templateRoutes from './routes/template.routes';
import instructorRoutes from './routes/instructor.routes';
import voiceRoutes from './routes/voice.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later.',
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? FRONTEND_URL
    : true, // Allow all origins in development
  credentials: true,
}));

// Log CORS configuration for debugging
console.log('CORS enabled for:', FRONTEND_URL);
app.use(express.json());
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/configurations', configRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/voice', voiceRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: ${FRONTEND_URL}`);
});

export default app;
