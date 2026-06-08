"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const appointmentSchema = new mongoose_1.default.Schema({
    doctorId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:mm
    status: {
        type: String,
        enum: ["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
        default: "SCHEDULED"
    },
    reason: { type: String },
    notes: { type: String },
}, { timestamps: true });
const Appointment = mongoose_1.default.model("Appointment", appointmentSchema);
exports.default = Appointment;
