import { Router, Request, Response } from 'express';
import db from '../db';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateToken, JwtPayload } from '../middleware/auth';
import { Role, ROLES } from '../config';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;

    // Validate input
    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Email, password, and full_name are required' });
      return;
    }

    // Validate role if provided
    const userRole: Role = role && ROLES.includes(role) ? role : 'MEMBER';

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(email, password_hash, full_name, userRole);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.lastInsertRowid,
        email,
        full_name,
        role: userRole,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = db.prepare(`
      SELECT id, email, password_hash, full_name, role 
      FROM users WHERE email = ?
    `).get(email) as { id: number; email: string; password_hash: string; full_name: string; role: Role } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(payload);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
