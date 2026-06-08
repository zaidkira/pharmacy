import { Request, Response } from "express";
import { prisma } from "../config/db";
import { getIO } from "../socket";

export const createOrder = async (req: Request | any, res: Response) => {
  try {
    const { pharmacyId, items, totalAmount, prescriptionUrl } = req.body;
    
    if (req.user.role !== "CUSTOMER") {
      res.status(403).json({ message: "Only customers can place new orders" });
      return;
    }

    if (!items || items.length === 0) {
      res.status(400).json({ message: "No order items" });
      return;
    }

    // 1. Check stock availability for all items
    for (const item of items) {
      const medicine = await prisma.medicine.findUnique({ where: { id: item.medicineId } });
      if (!medicine) {
        res.status(404).json({ message: `Medicine not found: ${item.name}` });
        return;
      }
      if (medicine.stock < item.quantity) {
        res.status(400).json({ message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}` });
        return;
      }
    }

    // 2. Create order
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        pharmacyId,
        items: items || [],
        totalAmount,
        prescriptionUrl,
        status: "PENDING"
      }
    });

    // 3. Deduct from stock
    for (const item of items) {
      await prisma.medicine.update({
        where: { id: item.medicineId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // 4. Emit real-time notification to the Pharmacy
    try {
      getIO().to(pharmacyId).emit("new_order", { ...order, _id: order.id });
    } catch (socketError) {
      console.error("Socket error on order creation:", socketError);
    }

    res.status(201).json({ ...order, _id: order.id });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserOrders = async (req: Request | any, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { pharmacy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" }
    });
    // Map for frontend compatibility - pharmacy info comes from User table
    const mapped = orders.map(o => ({
      ...o,
      _id: o.id,
      pharmacyId: o.pharmacy ? { ...o.pharmacy, _id: o.pharmacy.id } : null
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        pharmacy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    const mapped = orders.map(o => ({
      ...o,
      _id: o.id,
      userId: { ...o.user, _id: o.user.id },
      pharmacyId: o.pharmacy ? { ...o.pharmacy, _id: o.pharmacy.id } : null
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPharmacyOrders = async (req: Request | any, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { pharmacyId: req.params.pharmacyId },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" }
    });
    const mapped = orders.map(o => ({
      ...o,
      _id: o.id,
      userId: { ...o.user, _id: o.user.id }
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getIncomingOrders = async (req: Request | any, res: Response) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
    if (!pharmacy) {
      res.status(404).json({ message: "No pharmacy associated with this account" });
      return;
    }
    // Orders reference pharmacyId pointing to the User id (the pharmacy owner)
    const orders = await prisma.order.findMany({
      where: { pharmacyId: req.user.id },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" }
    });
    const mapped = orders.map(o => ({
      ...o,
      _id: o.id,
      userId: { ...o.user, _id: o.user.id }
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateOrderStatus = async (req: Request | any, res: Response) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Allow if ADMIN or if user is the PHARMACY_OWNER of this pharmacy
    if (req.user.role !== "ADMIN") {
      const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
      if (!pharmacy || order.pharmacyId !== req.user.id) {
        res.status(403).json({ message: "Not authorized to update this order" });
        return;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status }
    });
    
    res.json({ ...updatedOrder, _id: updatedOrder.id });
  } catch (error: any) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};
