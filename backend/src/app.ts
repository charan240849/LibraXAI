import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.routes';
import booksRoutes from './routes/books.routes';
import loansRoutes from './routes/loans.routes';
import reservationsRoutes from './routes/reservations.routes';
import searchRoutes from './routes/search.routes';
import recommendationsRoutes from './routes/recommendations.routes';
import inventoryRoutes from './routes/inventory.routes';
import notificationsRoutes from './routes/notifications.routes';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/books', booksRoutes);
app.use('/loans', loansRoutes);
app.use('/reservations', reservationsRoutes);
app.use('/search', searchRoutes);
app.use('/recommendations', recommendationsRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/notifications', notificationsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
