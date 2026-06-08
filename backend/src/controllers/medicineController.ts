import { Request, Response } from "express";
import { prisma } from "../config/db";

export const getMedicines = async (req: Request, res: Response) => {
  try {
    const medicines = await prisma.medicine.findMany({
      include: { pharmacy: { select: { id: true, name: true, address: true } } }
    });
    const mapped = medicines.map(m => ({
      ...m,
      _id: m.id,
      pharmacyId: m.pharmacy ? { ...m.pharmacy, _id: m.pharmacy.id } : null,
      pharmacyName: m.pharmacy?.name || "Standard Pharmacy",
      stockQuantity: m.stock
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        stock: req.body.stock ?? req.body.stockQuantity,
        requiresPrescription: req.body.requiresPrescription,
        image: req.body.image
      }
    });
    res.json({ ...medicine, _id: medicine.id, stockQuantity: medicine.stock });
  } catch (error: any) {
    res.status(400).json({ message: "Update failed", error: error.message });
  }
};

export const createMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await prisma.medicine.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        stock: req.body.stock ?? req.body.stockQuantity ?? 0,
        requiresPrescription: req.body.requiresPrescription || false,
        image: req.body.image,
        pharmacyId: req.body.pharmacyId
      }
    });
    res.status(201).json({ ...medicine, _id: medicine.id, stockQuantity: medicine.stock });
  } catch (error: any) {
    res.status(400).json({ message: "Invalid data", error: error.message });
  }
};

export const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.medicine.delete({ where: { id } });
    res.json({ message: "Medicine deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

export const getMyMedicines = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId as string;
    const medicines = await prisma.medicine.findMany({
      where: { pharmacyId },
      include: { pharmacy: { select: { id: true, name: true } } }
    });
    const mapped = medicines.map(m => ({
      ...m,
      _id: m.id,
      pharmacyId: m.pharmacy ? { ...m.pharmacy, _id: m.pharmacy.id } : null,
      stockQuantity: m.stock
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
