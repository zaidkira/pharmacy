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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientSentPrescriptions = exports.updatePharmacyPrescriptionStatus = exports.getPharmacyPrescriptions = exports.sendPrescriptionToPharmacy = exports.getPatientPrescriptions = exports.getDoctorPrescriptions = exports.createPrescription = void 0;
const db_1 = require("../config/db");
const createPrescription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, medications, diagnosis, notes, appointmentId } = req.body;
        const doctorId = req.user.id;
        const prescription = yield db_1.prisma.prescription.create({
            data: {
                doctorId,
                patientId,
                medications: medications || [],
                diagnosis,
                notes
            }
        });
        if (appointmentId) {
            yield db_1.prisma.appointment.update({
                where: { id: appointmentId },
                data: { status: "COMPLETED" }
            });
        }
        try {
            const { getIO } = require("../socket");
            const io = getIO();
            io.to(patientId).emit("new_prescription", Object.assign(Object.assign({}, prescription), { _id: prescription.id }));
        }
        catch (err) {
            console.error("Socket emit failed", err);
        }
        res.status(201).json(Object.assign(Object.assign({}, prescription), { _id: prescription.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Error creating prescription", error: error.message });
    }
});
exports.createPrescription = createPrescription;
const getDoctorPrescriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctorId = req.user.id;
        const prescriptions = yield db_1.prisma.prescription.findMany({
            where: { doctorId },
            include: { patient: { select: { id: true, name: true, email: true } } }
        });
        const mapped = prescriptions.map(p => (Object.assign(Object.assign({}, p), { _id: p.id, patientId: Object.assign(Object.assign({}, p.patient), { _id: p.patient.id }) })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
    }
});
exports.getDoctorPrescriptions = getDoctorPrescriptions;
const getPatientPrescriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.user.id;
        const prescriptions = yield db_1.prisma.prescription.findMany({
            where: { patientId },
            include: {
                doctor: { select: { id: true, name: true, specialization: true } },
                pharmacy: { select: { id: true, name: true, address: true } }
            }
        });
        const mapped = prescriptions.map(p => (Object.assign(Object.assign({}, p), { _id: p.id, doctorId: Object.assign(Object.assign({}, p.doctor), { _id: p.doctor.id }), pharmacyId: p.pharmacy ? Object.assign(Object.assign({}, p.pharmacy), { _id: p.pharmacy.id }) : null })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
    }
});
exports.getPatientPrescriptions = getPatientPrescriptions;
const sendPrescriptionToPharmacy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prescriptionId, pharmacyId } = req.body;
        const patientId = req.user.id;
        const prescription = yield db_1.prisma.prescription.findUnique({ where: { id: prescriptionId } });
        if (!prescription) {
            res.status(404).json({ message: "Prescription not found" });
            return;
        }
        yield db_1.prisma.prescription.update({
            where: { id: prescriptionId },
            data: { pharmacyId, status: "SENT_TO_PHARMACY" }
        });
        const pharmacyPresc = yield db_1.prisma.pharmacyPrescription.create({
            data: {
                prescriptionId,
                pharmacyId,
                patientId,
                status: "Received"
            }
        });
        try {
            const { getIO } = require("../socket");
            const io = getIO();
            io.to(pharmacyId).emit("new_pharmacy_prescription", Object.assign(Object.assign({}, pharmacyPresc), { _id: pharmacyPresc.id }));
        }
        catch (err) {
            console.error("Socket emit failed", err);
        }
        res.json(Object.assign(Object.assign({}, pharmacyPresc), { _id: pharmacyPresc.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Error sending prescription", error: error.message });
    }
});
exports.sendPrescriptionToPharmacy = sendPrescriptionToPharmacy;
const getPharmacyPrescriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pharmacyId = req.user.id;
        const prescriptions = yield db_1.prisma.pharmacyPrescription.findMany({
            where: { pharmacyId },
            include: {
                prescription: {
                    include: {
                        doctor: { select: { id: true, name: true, specialization: true, email: true, phone: true, licenseNumber: true } }
                    }
                },
                patient: { select: { id: true, name: true, email: true, phone: true } }
            }
        });
        const mapped = prescriptions.map(p => (Object.assign(Object.assign({}, p), { _id: p.id, prescriptionId: Object.assign(Object.assign({}, p.prescription), { _id: p.prescription.id, doctorId: Object.assign(Object.assign({}, p.prescription.doctor), { _id: p.prescription.doctor.id }) }), patientId: Object.assign(Object.assign({}, p.patient), { _id: p.patient.id }) })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
    }
});
exports.getPharmacyPrescriptions = getPharmacyPrescriptions;
const updatePharmacyPrescriptionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, pharmacistNotes } = req.body;
        const id = req.params.id;
        const pharmacyPresc = yield db_1.prisma.pharmacyPrescription.update({
            where: { id },
            data: { status, pharmacistNotes: pharmacistNotes || "" },
            include: {
                patient: { select: { id: true, name: true } },
                pharmacy: { select: { id: true, name: true } }
            }
        });
        if (pharmacyPresc) {
            try {
                const { getIO } = require("../socket");
                const io = getIO();
                io.to(pharmacyPresc.patientId).emit("prescription_pharmacy_status_update", Object.assign(Object.assign({}, pharmacyPresc), { _id: pharmacyPresc.id }));
            }
            catch (err) {
                console.error("Socket emit failed", err);
            }
        }
        res.json(Object.assign(Object.assign({}, pharmacyPresc), { _id: pharmacyPresc.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Error updating pharmacy prescription status", error: error.message });
    }
});
exports.updatePharmacyPrescriptionStatus = updatePharmacyPrescriptionStatus;
const getPatientSentPrescriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.user.id;
        const records = yield db_1.prisma.pharmacyPrescription.findMany({
            where: { patientId },
            include: {
                pharmacy: { select: { id: true, name: true } },
                prescription: true
            }
        });
        const mapped = records.map(r => (Object.assign(Object.assign({}, r), { _id: r.id, pharmacyId: r.pharmacy ? Object.assign(Object.assign({}, r.pharmacy), { _id: r.pharmacy.id }) : null, prescriptionId: Object.assign(Object.assign({}, r.prescription), { _id: r.prescription.id }) })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Error getting tracking records", error: error.message });
    }
});
exports.getPatientSentPrescriptions = getPatientSentPrescriptions;
