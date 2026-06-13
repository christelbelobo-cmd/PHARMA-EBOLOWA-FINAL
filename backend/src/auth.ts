import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User, UserRole } from "./models/User.entity";
import { AppDataSource } from "./data-source";
import { log, LogLevel } from "./middleware/logger";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

export interface TokenPayload {
  sub: string;
  username: string;
  role: UserRole;
  pharmacyId?: string | null;
  iat?: number;
  exp?: number;
}

export function signToken(user: Partial<User>): string {
  const payload: TokenPayload = {
    sub: user.id!,
    username: user.username!,
    role: user.role!,
    pharmacyId: user.pharmacyId || null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    (req as any).user = decoded;
    return next();
  } catch (err) {
    log(LogLevel.WARN, "Invalid token", { error: (err as Error).message });
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function authorizeAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as TokenPayload;
  if (!user || user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
}

export function authorizePharmacist(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as TokenPayload;
  if (!user || (user.role !== UserRole.PHARMACIST && user.role !== UserRole.ADMIN)) {
    return res.status(403).json({ message: "Pharmacist access required" });
  }
  return next();
}

export function authorizePharmacyOwner(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as TokenPayload;
  const pharmacyIdParam = req.params.pharmacyId;

  if (!user) {
    return res.status(401).json({ message: "Missing user" });
  }

  if (user.role === UserRole.ADMIN) {
    return next();
  }

  if (user.role === UserRole.PHARMACIST && user.pharmacyId === pharmacyIdParam) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden" });
}
