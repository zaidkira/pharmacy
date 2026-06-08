"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const medicationSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
});
const prescriptionSchema = new mongoose_1.default.Schema({
    doctorId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    pharmacyId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }, // Assigned when patient sends it to a pharmacy
    medications: [medicationSchema],
    diagnosis: { type: String },
    notes: { type: String },
    status: {
        type: String,
        enum: ["ACTIVE", "SENT_TO_PHARMACY", "COMPLETED", "EXPIRED"],
        default: "ACTIVE"
    },
    date: { type: Date, default: Date.now },
}, { timestamps: true });
const Prescription = mongoose_1.default.model("Prescription", prescriptionSchema);
exports.default = Prescription;
