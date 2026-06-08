import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_dev_secret");

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          specialization: true,
          licenseNumber: true,
          status: true,
          schedule: true,
          healthProfile: true,
          createdAt: true
        }
      });

      if (!user) {
        res.status(401).json({ message: "Not authorized, user not found" });
        return;
      }

      // Add _id alias for frontend compatibility
      req.user = { ...user, _id: user.id };
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

export const customerOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "CUSTOMER") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized. Only customers can perform this action." });
  }
};

export const doctorOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "DOCTOR") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized. Only doctors can perform this action." });
  }
};

export const pharmacyOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "PHARMACY_OWNER") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized. Only pharmacies can perform this action." });
  }
};
