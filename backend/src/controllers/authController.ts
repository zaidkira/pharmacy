import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "default_dev_secret", {
    expiresIn: "30d",
  });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone, role, specialization, licenseNumber, schedule, status } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: role || "CUSTOMER",
        specialization,
        licenseNumber,
        schedule: schedule || null,
        status: status || "ACTIVE"
      }
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role),
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        specialization: true,
        licenseNumber: true,
        status: true,
        schedule: true,
        createdAt: true
      }
    });
    // map id to _id for frontend compatibility
    const mapped = users.map(u => ({ ...u, _id: u.id }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user && req.user.id === req.params.id) {
       res.status(400).json({ message: "Administrators cannot delete their own accounts." });
       return;
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User removed" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.order.count();
    const totalMedicines = await prisma.medicine.count();
    const totalPharmacies = await prisma.pharmacy.count();
    
    // Sum total completed orders amount
    const completedOrders = await prisma.order.findMany({
      where: { status: "DELIVERED" }
    });
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } }
      }
    });
    const mappedRecentOrders = recentOrders.map(o => ({
      ...o,
      _id: o.id,
      userId: { name: o.user.name }
    }));

    const pharmacies = await prisma.pharmacy.findMany({
      include: { user: true }
    });
    const mappedPharmacies = pharmacies.map(p => ({
      ...p,
      _id: p.id,
      name: p.name,
      address: p.address
    }));

    res.json({
      stats: [
        { title: "Total Users", value: totalUsers.toString(), change: "+5%", trend: "up", icon: "Users", color: "#0F766E" },
        { title: "Total Orders", value: totalOrders.toString(), change: "+8%", trend: "up", icon: "ShoppingBag", color: "#2F8F7E" },
        { title: "Medicines", value: totalMedicines.toString(), change: "+2%", trend: "up", icon: "Pill", color: "#5FA79A" },
        { title: "Revenue", value: `${totalRevenue.toFixed(2)} DZ`, change: "+12%", trend: "up", icon: "DollarSign", color: "#0F766E" },
        { title: "Pharmacies", value: totalPharmacies.toString(), change: "+4%", trend: "up", icon: "MapPin", color: "#2F8F7E" },
        { title: "Growth Rate", value: "15.5%", change: "+2%", trend: "up", icon: "TrendingUp", color: "#5FA79A" },
      ],
      recentOrders: mappedRecentOrders,
      pharmacies: mappedPharmacies
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  if (user) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
      createdAt: user.createdAt,
      healthProfile: user.healthProfile || {
        conditions: [],
        allergies: [],
        medications: [],
        bloodType: "",
        emergencyContact: {
          name: "",
          relationship: "",
          phone: ""
        }
      }
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user) {
      const updatedData: any = {
        name: req.body.name || user.name,
        email: req.body.email || user.email,
        phone: req.body.phone !== undefined ? req.body.phone : user.phone,
        address: req.body.address !== undefined ? req.body.address : user.address,
      };
      
      if (req.body.healthProfile) {
        const currentProfile: any = user.healthProfile || {};
        updatedData.healthProfile = {
          ...currentProfile,
          ...req.body.healthProfile,
          emergencyContact: {
            ...(currentProfile.emergencyContact || {}),
            ...(req.body.healthProfile.emergencyContact || {})
          }
        };
      }

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        updatedData.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updatedData
      });

      res.json({
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        healthProfile: updatedUser.healthProfile,
        token: generateToken(updatedUser.id, updatedUser.role),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: "Update failed", error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role: req.body.role || user.role }
      });
      res.json({ _id: updatedUser.id, name: updatedUser.name, role: updatedUser.role });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: "Update role failed", error: error.message });
  }
};

export const updateDoctorDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (user && user.role === "DOCTOR") {
      const updatedData: any = {
        name: req.body.name || user.name,
        email: req.body.email || user.email,
        phone: req.body.phone !== undefined ? req.body.phone : user.phone,
        specialization: req.body.specialization !== undefined ? req.body.specialization : user.specialization,
        licenseNumber: req.body.licenseNumber !== undefined ? req.body.licenseNumber : user.licenseNumber,
        status: req.body.status !== undefined ? req.body.status : user.status,
        schedule: req.body.schedule !== undefined ? req.body.schedule : user.schedule
      };

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        updatedData.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedDoctor = await prisma.user.update({
        where: { id },
        data: updatedData
      });
      res.json({ ...updatedDoctor, _id: updatedDoctor.id });
    } else {
      res.status(404).json({ message: "Doctor not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: "Update doctor failed", error: error.message });
  }
};
