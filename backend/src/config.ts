import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // SMTP (Mailhog)
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    from: process.env.SMTP_FROM || 'noreply@lms.test',
  },

  // Database
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../data/lms.db'),

  // Scheduler
  cronDailyTime: process.env.CRON_DAILY_TIME || '0 8 * * *',

  // Loan settings
  loanDurationDays: 14,
  maxRenewals: 2,
  dueSoonDays: 2, // Days before due to send reminder
};

export type Role = 'ADMIN' | 'LIBRARIAN' | 'MEMBER';

export const ROLES: Role[] = ['ADMIN', 'LIBRARIAN', 'MEMBER'];
