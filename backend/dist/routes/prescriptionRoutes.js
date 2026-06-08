"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const prescriptionController_1 = require("../controllers/prescriptionController");
const router = express_1.default.Router();
router.post("/", authMiddleware_1.protect, authMiddleware_1.doctorOnly, prescriptionController_1.createPrescription);
router.get("/doctor", authMiddleware_1.protect, authMiddleware_1.doctorOnly, prescriptionController_1.getDoctorPrescriptions);
router.get("/patient", authMiddleware_1.protect, authMiddleware_1.customerOnly, prescriptionController_1.getPatientPrescriptions);
router.get("/patient/tracking", authMiddleware_1.protect, authMiddleware_1.customerOnly, prescriptionController_1.getPatientSentPrescriptions);
router.post("/patient/upload-scan", authMiddleware_1.protect, authMiddleware_1.customerOnly, prescriptionController_1.uploadPatientScan);
router.post("/send-to-pharmacy", authMiddleware_1.protect, authMiddleware_1.customerOnly, prescriptionController_1.sendPrescriptionToPharmacy);
router.get("/pharmacy", authMiddleware_1.protect, authMiddleware_1.pharmacyOnly, prescriptionController_1.getPharmacyPrescriptions);
router.put("/pharmacy/:id/status", authMiddleware_1.protect, authMiddleware_1.pharmacyOnly, prescriptionController_1.updatePharmacyPrescriptionStatus);
exports.default = router;
