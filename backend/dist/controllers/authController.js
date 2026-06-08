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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDoctorDetails = exports.updateUserRole = exports.updateUserProfile = exports.getUserProfile = exports.getDashboardStats = exports.deleteUser = exports.getAllUsers = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET || "default_dev_secret", {
        expiresIn: "30d",
    });
};
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, phone, role, specialization, licenseNumber, schedule, status } = req.body;
    try {
        const userExists = yield db_1.prisma.user.findUnique({ where: { email } });
        if (userExists) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const user = yield db_1.prisma.user.create({
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield db_1.prisma.user.findUnique({ where: { email } });
        if (user && (yield bcryptjs_1.default.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
        }
        else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.loginUser = loginUser;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield db_1.prisma.user.findMany({
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
        const mapped = users.map(u => (Object.assign(Object.assign({}, u), { _id: u.id })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getAllUsers = getAllUsers;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user && req.user.id === req.params.id) {
            res.status(400).json({ message: "Administrators cannot delete their own accounts." });
            return;
        }
        yield db_1.prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: "User removed" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.deleteUser = deleteUser;
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalUsers = yield db_1.prisma.user.count();
        const totalOrders = yield db_1.prisma.order.count();
        const totalMedicines = yield db_1.prisma.medicine.count();
        const totalPharmacies = yield db_1.prisma.pharmacy.count();
        // Sum total completed orders amount
        const completedOrders = yield db_1.prisma.order.findMany({
            where: { status: "DELIVERED" }
        });
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const recentOrders = yield db_1.prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true } }
            }
        });
        const mappedRecentOrders = recentOrders.map(o => (Object.assign(Object.assign({}, o), { _id: o.id, userId: { name: o.user.name } })));
        const pharmacies = yield db_1.prisma.pharmacy.findMany({
            include: { user: true }
        });
        const mappedPharmacies = pharmacies.map(p => (Object.assign(Object.assign({}, p), { _id: p.id, name: p.name, address: p.address })));
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getDashboardStats = getDashboardStats;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
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
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
});
exports.getUserProfile = getUserProfile;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const user = yield db_1.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            const updatedData = {
                name: req.body.name || user.name,
                email: req.body.email || user.email,
                phone: req.body.phone !== undefined ? req.body.phone : user.phone,
                address: req.body.address !== undefined ? req.body.address : user.address,
            };
            if (req.body.healthProfile) {
                const currentProfile = user.healthProfile || {};
                updatedData.healthProfile = Object.assign(Object.assign(Object.assign({}, currentProfile), req.body.healthProfile), { emergencyContact: Object.assign(Object.assign({}, (currentProfile.emergencyContact || {})), (req.body.healthProfile.emergencyContact || {})) });
            }
            if (req.body.password) {
                const salt = yield bcryptjs_1.default.genSalt(10);
                updatedData.password = yield bcryptjs_1.default.hash(req.body.password, salt);
            }
            const updatedUser = yield db_1.prisma.user.update({
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
        }
        else {
            res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        res.status(400).json({ message: "Update failed", error: error.message });
    }
});
exports.updateUserProfile = updateUserProfile;
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const user = yield db_1.prisma.user.findUnique({ where: { id } });
        if (user) {
            const updatedUser = yield db_1.prisma.user.update({
                where: { id },
                data: { role: req.body.role || user.role }
            });
            res.json({ _id: updatedUser.id, name: updatedUser.name, role: updatedUser.role });
        }
        else {
            res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        res.status(400).json({ message: "Update role failed", error: error.message });
    }
});
exports.updateUserRole = updateUserRole;
const updateDoctorDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const user = yield db_1.prisma.user.findUnique({ where: { id } });
        if (user && user.role === "DOCTOR") {
            const updatedData = {
                name: req.body.name || user.name,
                email: req.body.email || user.email,
                phone: req.body.phone !== undefined ? req.body.phone : user.phone,
                specialization: req.body.specialization !== undefined ? req.body.specialization : user.specialization,
                licenseNumber: req.body.licenseNumber !== undefined ? req.body.licenseNumber : user.licenseNumber,
                status: req.body.status !== undefined ? req.body.status : user.status,
                schedule: req.body.schedule !== undefined ? req.body.schedule : user.schedule
            };
            if (req.body.password) {
                const salt = yield bcryptjs_1.default.genSalt(10);
                updatedData.password = yield bcryptjs_1.default.hash(req.body.password, salt);
            }
            const updatedDoctor = yield db_1.prisma.user.update({
                where: { id },
                data: updatedData
            });
            res.json(Object.assign(Object.assign({}, updatedDoctor), { _id: updatedDoctor.id }));
        }
        else {
            res.status(404).json({ message: "Doctor not found" });
        }
    }
    catch (error) {
        res.status(400).json({ message: "Update doctor failed", error: error.message });
    }
});
exports.updateDoctorDetails = updateDoctorDetails;
