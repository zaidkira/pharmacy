import { Request, Response } from "express";
import { prisma } from "../config/db";

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, date, time, reason } = req.body;
    const patientId = (req as any).user.id;

    const appointment = await prisma.appointment.create({
      data: { doctorId, patientId, date, time, reason }
    });

    res.status(201).json({ ...appointment, _id: appointment.id });
  } catch (error: any) {
    res.status(500).json({ message: "Error creating appointment", error: error.message });
  }
};

export const adminCreateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, patientId, date, time, reason, notes } = req.body;

    const appointment = await prisma.appointment.create({
      data: { doctorId, patientId, date, time, reason, notes }
    });

    res.status(201).json({ ...appointment, _id: appointment.id });
  } catch (error: any) {
    res.status(500).json({ message: "Error creating appointment by admin", error: error.message });
  }
};

export const getDoctorDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const today = new Date().toISOString().split("T")[0];

    const todayAppointments = await prisma.appointment.findMany({
      where: { doctorId, date: today }
    });
    const completedConsultations = todayAppointments.filter(a => a.status === "COMPLETED").length;
    const pendingAppointments = todayAppointments.filter(a => a.status === "SCHEDULED" || a.status === "PENDING" || a.status === "IN_PROGRESS").length;
    
    const prescriptionsCount = await prisma.prescription.count({ where: { doctorId } });

    res.json({
      patientsToday: todayAppointments.length,
      completedConsultations,
      pendingAppointments,
      prescriptionsSent: prescriptionsCount
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error getting doctor statistics", error: error.message });
  }
};

export const getDoctorAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true, healthProfile: true } }
      },
      orderBy: [{ date: "asc" }, { time: "asc" }]
    });
    const mapped = appointments.map(a => ({
      ...a,
      _id: a.id,
      patientId: { ...a.patient, _id: a.patient.id }
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching appointments", error: error.message });
  }
};

export const getTodayAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const today = new Date().toISOString().split("T")[0];
    
    const appointments = await prisma.appointment.findMany({
      where: { doctorId, date: today },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true, healthProfile: true } }
      },
      orderBy: { time: "asc" }
    });
    const mapped = appointments.map(a => ({
      ...a,
      _id: a.id,
      patientId: { ...a.patient, _id: a.patient.id }
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching today's appointments", error: error.message });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const id = req.params.id as string;
    const appointment = await prisma.appointment.update({
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
        io.to(appointment.patientId).emit("appointment_status_update", { ...appointment, _id: appointment.id });
        io.to(appointment.doctorId).emit("appointment_status_update", { ...appointment, _id: appointment.id });
      } catch (err) {
        console.error("Socket emit failed", err);
      }
    }

    res.json({ ...appointment, _id: appointment.id });
  } catch (error: any) {
    res.status(500).json({ message: "Error updating appointment", error: error.message });
  }
};

export const getPatientAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } }
      },
      orderBy: [{ date: "asc" }, { time: "asc" }]
    });
    const mapped = appointments.map(a => ({
      ...a,
      _id: a.id,
      doctorId: { ...a.doctor, _id: a.doctor.id }
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching appointments", error: error.message });
  }
};
