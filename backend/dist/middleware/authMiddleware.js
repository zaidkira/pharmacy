"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pharmacyOnly = exports.doctorOnly = exports.customerOnly = exports.adminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default_dev_secret");
            const user = yield db_1.prisma.user.findUnique({
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
            req.user = Object.assign(Object.assign({}, user), { _id: user.id });
            next();
        }
        catch (error) {
            res.status(401).json({ message: "Not authorized, token failed" });
            return;
        }
    }
    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
});
exports.protect = protect;
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") {
        next();
    }
    else {
        res.status(403).json({ message: "Not authorized as an admin" });
    }
};
exports.adminOnly = adminOnly;
const customerOnly = (req, res, next) => {
    if (req.user && req.user.role === "CUSTOMER") {
        next();
    }
    else {
        res.status(403).json({ message: "Not authorized. Only customers can perform this action." });
    }
};
exports.customerOnly = customerOnly;
const doctorOnly = (req, res, next) => {
    if (req.user && req.user.role === "DOCTOR") {
        next();
    }
    else {
        res.status(403).json({ message: "Not authorized. Only doctors can perform this action." });
    }
};
exports.doctorOnly = doctorOnly;
const pharmacyOnly = (req, res, next) => {
    if (req.user && req.user.role === "PHARMACY_OWNER") {
        next();
    }
    else {
        res.status(403).json({ message: "Not authorized. Only pharmacies can perform this action." });
    }
};
exports.pharmacyOnly = pharmacyOnly;
