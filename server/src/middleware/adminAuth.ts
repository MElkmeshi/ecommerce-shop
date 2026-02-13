import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

export interface AdminPayload {
  id: number;
  username: string;
}

/**
 * Generate JWT token for admin
 */
export function generateAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token and extract payload
 */
export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to verify admin authentication.
 * Checks the Authorization header for a valid JWT token.
 */
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  const admin = verifyAdminToken(token);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  (req as any).admin = admin; // Attach admin to request
  next();
}
