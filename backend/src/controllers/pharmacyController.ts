import { Request, Response } from "express";
import { prisma } from "../config/db";

export const getPharmacies = async (req: Request, res: Response) => {
  try {
    // PostgreSQL doesn't have $near geospatial by default, so return all pharmacies
    const pharmacies = await prisma.pharmacy.findMany({
      include: { user: { select: { name: true } } }
    });
    const mapped = pharmacies.map(p => ({ ...p, _id: p.id }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const createPharmacy = async (req: any, res: Response) => {
  try {
    const existing = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
    if (existing && req.user.role !== "ADMIN") {
      res.status(400).json({ message: "You already have a pharmacy registered" });
      return;
    }

    const ownerId = req.user.role === "ADMIN" ? (req.body.ownerId || req.user.id) : req.user.id;

    const pharmacy = await prisma.pharmacy.create({
      data: {
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        email: req.body.email,
        userId: ownerId
      }
    });

    res.status(201).json({ ...pharmacy, _id: pharmacy.id });
  } catch (error: any) {
    res.status(400).json({ message: "Invalid data", error: error.message });
  }
};

export const updatePharmacy = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const pharmacy = await prisma.pharmacy.update({
      where: { id },
      data: {
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        email: req.body.email
      }
    });
    res.json({ ...pharmacy, _id: pharmacy.id });
  } catch (error: any) {
    res.status(400).json({ message: "Update failed", error: error.message });
  }
};

export const deletePharmacy = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.pharmacy.delete({ where: { id } });
    res.json({ message: "Pharmacy deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

export const getMyPharmacy = async (req: any, res: Response) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
    if (!pharmacy) {
      res.status(404).json({ message: "No pharmacy found for this owner" });
      return;
    }
    res.json({ ...pharmacy, _id: pharmacy.id });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateMyPharmacy = async (req: any, res: Response) => {
  try {
    const pharmacy = await prisma.pharmacy.update({
      where: { userId: req.user.id },
      data: {
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        email: req.body.email
      }
    });
    res.json({ ...pharmacy, _id: pharmacy.id });
  } catch (error: any) {
    res.status(400).json({ message: "Update failed", error: error.message });
  }
};
