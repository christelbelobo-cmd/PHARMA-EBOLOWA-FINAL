import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from './users';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(user: Partial<User>) {
  const payload = {
    sub: user.username,
    role: user.role,
    pharmacyId: (user as any).pharmacyId || null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorizeAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as any;
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  return next();
}

export function authorizePharmacistOrAdminForPharmacy(pharmacyIdParam = 'pharmacyId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as any;
    if (!user) return res.status(401).json({ message: 'Missing user' });
    if (user.role === 'admin') return next();
    if (user.role === 'pharmacist' && user.pharmacyId === req.params[pharmacyIdParam]) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}
