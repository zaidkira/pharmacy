"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pharmacyPrescriptionSchema = new mongoose_1.default.Schema({
    prescriptionId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Prescription", required: true },
    pharmacyId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: ["Received", "Processing", "Ready for Pickup", "Completed"],
        default: "Received"
    },
    pharmacistNotes: { type: String, default: "" },
    sentAt: { type: Date, default: Date.now }
}, { timestamps: true });
const PharmacyPrescription = mongoose_1.default.model("PharmacyPrescription", pharmacyPrescriptionSchema);
exports.default = PharmacyPrescription;
