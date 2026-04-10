import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized Access. Please log in" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.user = decoded; // ✅ no "as any"

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}