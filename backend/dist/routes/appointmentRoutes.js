"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const appointmentController_1 = require("../controllers/appointmentController");
const router = express_1.default.Router();
router.post("/", authMiddleware_1.protect, authMiddleware_1.customerOnly, appointmentController_1.createAppointment);
router.post("/admin-assign", authMiddleware_1.protect, authMiddleware_1.adminOnly, appointmentController_1.adminCreateAppointment);
router.get("/doctor", authMiddleware_1.protect, authMiddleware_1.doctorOnly, appointmentController_1.getDoctorAppointments);
router.get("/doctor/today", authMiddleware_1.protect, authMiddleware_1.doctorOnly, appointmentController_1.getTodayAppointments);
router.get("/doctor/stats", authMiddleware_1.protect, authMiddleware_1.doctorOnly, appointmentController_1.getDoctorDashboardStats);
router.put("/:id/status", authMiddleware_1.protect, appointmentController_1.updateAppointmentStatus);
router.get("/patient", authMiddleware_1.protect, authMiddleware_1.customerOnly, appointmentController_1.getPatientAppointments);
exports.default = router;
