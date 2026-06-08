import { Request, Response } from "express";
import { prisma } from "../config/db";

export const createPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, medications, diagnosis, notes, appointmentId, fileUrl } = req.body;
    const doctorId = (req as any).user.id;

    const prescription = await prisma.prescription.create({
      data: {
        doctorId,
        patientId,
        medications: medications || [],
        diagnosis,
        notes,
        fileUrl
      }
    });

    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" }
      });
    }

    try {
      const { getIO } = require("../socket");
      const io = getIO();
      io.to(patientId).emit("new_prescription", { ...prescription, _id: prescription.id });
    } catch (err) {
      console.error("Socket emit failed", err);
    }

    res.status(201).json({ ...prescription, _id: prescription.id });
  } catch (error: any) {
    res.status(500).json({ message: "Error creating prescription", error: error.message });
  }
};

export const getDoctorPrescriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId },
      include: { patient: { select: { id: true, name: true, email: true } } }
    });
    const mapped = prescriptions.map(p => ({
      ...p,
      _id: p.id,
      patientId: { ...p.patient, _id: p.patient.id }
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
  }
};

export const getPatientPrescriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        pharmacy: { select: { id: true, name: true, address: true } }
      }
    });
    const mapped = prescriptions.map(p => ({
      ...p,
      _id: p.id,
      doctorId: p.doctor ? { ...p.doctor, _id: p.doctor.id } : null,
      pharmacyId: p.pharmacy ? { ...p.pharmacy, _id: p.pharmacy.id } : null
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
  }
};

export const sendPrescriptionToPharmacy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prescriptionId, pharmacyId } = req.body;
    const patientId = (req as any).user.id;

    // Resolve the pharmacy owner's User ID (since pharmacyId in the UI represents the Pharmacy table ID, but relations map to User)
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId }
    });

    if (!pharmacy) {
      res.status(404).json({ message: "Pharmacy not found" });
      return;
    }

    const targetUserId = pharmacy.userId;

    const prescription = await prisma.prescription.findUnique({ where: { id: prescriptionId } });

    if (!prescription) {
      res.status(404).json({ message: "Prescription not found" });
      return;
    }

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { pharmacyId: targetUserId, status: "SENT_TO_PHARMACY" }
    });

    const pharmacyPresc = await prisma.pharmacyPrescription.create({
      data: {
        prescriptionId,
        pharmacyId: targetUserId,
        patientId,
        status: "Received"
      }
    });

    try {
      const { getIO } = require("../socket");
      const io = getIO();
      io.to(targetUserId).emit("new_pharmacy_prescription", { ...pharmacyPresc, _id: pharmacyPresc.id });
    } catch (err) {
      console.error("Socket emit failed", err);
    }

    res.json({ ...pharmacyPresc, _id: pharmacyPresc.id });
  } catch (error: any) {
    res.status(500).json({ message: "Error sending prescription", error: error.message });
  }
};

export const getPharmacyPrescriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const pharmacyId = (req as any).user.id;
    const prescriptions = await prisma.pharmacyPrescription.findMany({
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
    const mapped = prescriptions.map(p => ({
      ...p,
      _id: p.id,
      prescriptionId: {
        ...p.prescription,
        _id: p.prescription.id,
        doctorId: p.prescription.doctor ? { ...p.prescription.doctor, _id: p.prescription.doctor.id } : null
      },
      patientId: { ...p.patient, _id: p.patient.id }
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
  }
};

export const updatePharmacyPrescriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, pharmacistNotes } = req.body;
    const id = req.params.id as string;
    const pharmacyPresc = await prisma.pharmacyPrescription.update({
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
        io.to(pharmacyPresc.patientId).emit("prescription_pharmacy_status_update", { ...pharmacyPresc, _id: pharmacyPresc.id });
      } catch (err) {
        console.error("Socket emit failed", err);
      }
    }

    res.json({ ...pharmacyPresc, _id: pharmacyPresc.id });
  } catch (error: any) {
    res.status(500).json({ message: "Error updating pharmacy prescription status", error: error.message });
  }
};

export const getPatientSentPrescriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const records = await prisma.pharmacyPrescription.findMany({
      where: { patientId },
      include: {
        pharmacy: { select: { id: true, name: true } },
        prescription: true
      }
    });
    const mapped = records.map(r => ({
      ...r,
      _id: r.id,
      pharmacyId: r.pharmacy ? { ...r.pharmacy, _id: r.pharmacy.id } : null,
      prescriptionId: { ...r.prescription, _id: r.prescription.id }
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Error getting tracking records", error: error.message });
  }
};

export const uploadPatientScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pharmacyId, fileUrl, diagnosis, notes } = req.body;
    const patientId = (req as any).user.id;

    // Resolve the pharmacy owner's User ID
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId }
    });

    if (!pharmacy) {
      res.status(404).json({ message: "Pharmacy not found" });
      return;
    }

    const targetUserId = pharmacy.userId;

    // 1. Create a custom self-uploaded prescription
    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        medications: [],
        diagnosis: diagnosis || "Self-uploaded medical file",
        notes: notes || "Patient self-uploaded attachment",
        fileUrl,
        status: "SENT_TO_PHARMACY",
        pharmacyId: targetUserId
      }
    });

    // 2. Share with the pharmacy
    const pharmacyPresc = await prisma.pharmacyPrescription.create({
      data: {
        prescriptionId: prescription.id,
        pharmacyId: targetUserId,
        patientId,
        status: "Received",
        pharmacistNotes: ""
      }
    });

    // 3. Notify pharmacy via Socket.io
    try {
      const { getIO } = require("../socket");
      const io = getIO();
      io.to(targetUserId).emit("new_pharmacy_prescription", { ...pharmacyPresc, _id: pharmacyPresc.id });
    } catch (err) {
      console.error("Socket emit failed", err);
    }

    res.status(201).json({ ...pharmacyPresc, _id: pharmacyPresc.id });
  } catch (error: any) {
    res.status(500).json({ message: "Error uploading and sharing scan", error: error.message });
  }
};

export const sendPrescriptionByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientEmail, medications, diagnosis, notes, fileUrl } = req.body;
    const doctorId = (req as any).user.id;

    if (!patientEmail) {
      res.status(400).json({ message: "Patient email is required" });
      return;
    }

    // Look up the patient by email
    const patient = await prisma.user.findUnique({
      where: { email: patientEmail.toLowerCase().trim() }
    });

    if (!patient) {
      res.status(404).json({ message: "No user found with this email address. The patient must have an account first." });
      return;
    }

    if (patient.role !== "CUSTOMER") {
      res.status(400).json({ message: "This email does not belong to a patient account." });
      return;
    }

    // Create the prescription
    const prescription = await prisma.prescription.create({
      data: {
        doctorId,
        patientId: patient.id,
        medications: medications || [],
        diagnosis: diagnosis || "Medical Certificate",
        notes: notes || "",
        fileUrl: fileUrl || undefined,
        status: "ACTIVE"
      }
    });

    // Notify patient via Socket.io
    try {
      const { getIO } = require("../socket");
      const io = getIO();
      io.to(patient.id).emit("new_prescription", { ...prescription, _id: prescription.id });
    } catch (err) {
      console.error("Socket emit failed", err);
    }

    res.status(201).json({
      ...prescription,
      _id: prescription.id,
      patientName: patient.name,
      patientEmail: patient.email
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error sending prescription by email", error: error.message });
  }
};
