"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/register", authController_1.registerUser);
router.post("/login", authController_1.loginUser);
router.get("/users", authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.getAllUsers);
router.put("/users/:id/role", authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.updateUserRole);
router.put("/users/doctor/:id", authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.updateDoctorDetails);
router.delete("/users/:id", authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.deleteUser);
router.get("/stats", authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.getDashboardStats);
router.get("/profile", authMiddleware_1.protect, authController_1.getUserProfile);
router.put("/profile", authMiddleware_1.protect, authController_1.updateUserProfile);
exports.default = router;
