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
exports.getPatientAppointments = exports.updateAppointmentStatus = exports.getTodayAppointments = exports.getDoctorAppointments = exports.getDoctorDashboardStats = exports.adminCreateAppointment = exports.createAppointment = void 0;
const db_1 = require("../config/db");
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, date, time, reason } = req.body;
        const patientId = req.user.id;
        const appointment = yield db_1.prisma.appointment.create({
            data: { doctorId, patientId, date, time, reason }
        });
        res.status(201).json(Object.assign(Object.assign({}, appointment), { _id: appointment.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Error creating appointment", error: error.message });
    }
});
exports.createAppointment = createAppointment;
const adminCreateAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, patientId, date, time, reason, notes } = req.body;
        const appointment = yield db_1.prisma.appointment.create({
            data: { doctorId, patientId, date, time, reason, notes }
        });
        res.status(201).json(Object.assign(Object.assign({}, appointment), { _id: appointment.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Error creating appointment by admin", error: error.message });
    }
});
exports.adminCreateAppointment = adminCreateAppointment;
const getDoctorDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctorId = req.user.id;
        const today = new Date().toISOString().split("T")[0];
        const todayAppointments = yield db_1.prisma.appointment.findMany({
            where: { doctorId, date: today }
        });
        const completedConsultations = todayAppointments.filter(a => a.status === "COMPLETED").length;
        const pendingAppointments = todayAppointments.filter(a => a.status === "SCHEDULED" || a.status === "PENDING" || a.status === "IN_PROGRESS").length;
        const prescriptionsCount = yield db_1.prisma.prescription.count({ where: { doctorId } });
        res.json({
            patientsToday: todayAppointments.length,
            completedConsultations,
            pendingAppointments,
            prescriptionsSent: prescriptionsCount
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error getting doctor statistics", error: error.message });
    }
});
exports.getDoctorDashboardStats = getDoctorDashboardStats;
const getDoctorAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctorId = req.user.id;
        const appointments = yield db_1.prisma.appointment.findMany({
            where: { doctorId },
            include: {
                patient: { select: { id: true, name: true, email: true, phone: true, healthProfile: true } }
            },
            orderBy: [{ date: "asc" }, { time: "asc" }]
        });
        const mapped = appointments.map(a => (Object.assign(Object.assign({}, a), { _id: a.id, patientId: Object.assign(Object.assign({}, a.patient), { _id: a.patient.id }) })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching appointments", error: error.message });
    }
});
exports.getDoctorAppointments = getDoctorAppointments;
const getTodayAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctorId = req.user.id;
        const today = new Date().toISOString().split("T")[0];
        const appointments = yield db_1.prisma.appointment.findMany({
            where: { doctorId, date: today },
            include: {
                patient: { select: { id: true, name: true, email: true, phone: true, healthProfile: true } }
            },
            orderBy: { time: "asc" }
        });
        const mapped = appointments.map(a => (Object.assign(Object.assign({}, a), { _id: a.id, patientId: Object.assign(Object.assign({}, a.patient), { _id: a.patient.id }) })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching today's appointments", error: error.message });
    }
});
exports.getTodayAppointments = getTodayAppointments;
const updateAppointmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        const id = req.params.id;
        const appointment = yield db_1.prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                patient: { select: { id: true, name: true } },
                doctor: { select: { id: true, name: true } }
            }
        });
        if (appointment) {
            try {
                const { getIO } = require("../socket");
                const io = getIO();
                io.to(appointment.patientId).emit("appointment_status_update", Object.assign(Object.assign({}, appointment), { _id: appointment.id }));
                io.to(appointment.doctorId).emit("appointment_status_update", Object.assign(Object.assign({}, appointment), { _id: appointment.id }));
            }
            catch (err) {
                console.error("Socket emit failed", err);
            }
        }
        res.json(Object.assign(Object.assign({}, appointment), { _id: appointment.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Error updating appointment", error: error.message });
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
const getPatientAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.user.id;
        const appointments = yield db_1.prisma.appointment.findMany({
            where: { patientId },
            include: {
                doctor: { select: { id: true, name: true, specialization: true } }
            },
            orderBy: [{ date: "asc" }, { time: "asc" }]
        });
        const mapped = appointments.map(a => (Object.assign(Object.assign({}, a), { _id: a.id, doctorId: Object.assign(Object.assign({}, a.doctor), { _id: a.doctor.id }) })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching appointments", error: error.message });
    }
});
exports.getPatientAppointments = getPatientAppointments;
