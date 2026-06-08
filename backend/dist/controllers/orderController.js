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
exports.updateOrderStatus = exports.getIncomingOrders = exports.getPharmacyOrders = exports.getAllOrders = exports.getUserOrders = exports.createOrder = void 0;
const db_1 = require("../config/db");
const socket_1 = require("../socket");
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const medicine = yield db_1.prisma.medicine.findUnique({ where: { id: item.medicineId } });
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
        const order = yield db_1.prisma.order.create({
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
            yield db_1.prisma.medicine.update({
                where: { id: item.medicineId },
                data: { stock: { decrement: item.quantity } }
            });
        }
        // 4. Emit real-time notification to the Pharmacy
        try {
            (0, socket_1.getIO)().to(pharmacyId).emit("new_order", Object.assign(Object.assign({}, order), { _id: order.id }));
        }
        catch (socketError) {
            console.error("Socket error on order creation:", socketError);
        }
        res.status(201).json(Object.assign(Object.assign({}, order), { _id: order.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.createOrder = createOrder;
const getUserOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield db_1.prisma.order.findMany({
            where: { userId: req.user.id },
            include: { pharmacy: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" }
        });
        // Map for frontend compatibility - pharmacy info comes from User table
        const mapped = orders.map(o => (Object.assign(Object.assign({}, o), { _id: o.id, pharmacyId: o.pharmacy ? Object.assign(Object.assign({}, o.pharmacy), { _id: o.pharmacy.id }) : null })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getUserOrders = getUserOrders;
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield db_1.prisma.order.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                pharmacy: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        const mapped = orders.map(o => (Object.assign(Object.assign({}, o), { _id: o.id, userId: Object.assign(Object.assign({}, o.user), { _id: o.user.id }), pharmacyId: o.pharmacy ? Object.assign(Object.assign({}, o.pharmacy), { _id: o.pharmacy.id }) : null })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getAllOrders = getAllOrders;
const getPharmacyOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield db_1.prisma.order.findMany({
            where: { pharmacyId: req.params.pharmacyId },
            include: { user: { select: { id: true, name: true, email: true, phone: true } } },
            orderBy: { createdAt: "desc" }
        });
        const mapped = orders.map(o => (Object.assign(Object.assign({}, o), { _id: o.id, userId: Object.assign(Object.assign({}, o.user), { _id: o.user.id }) })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getPharmacyOrders = getPharmacyOrders;
const getIncomingOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pharmacy = yield db_1.prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
        if (!pharmacy) {
            res.status(404).json({ message: "No pharmacy associated with this account" });
            return;
        }
        // Orders reference pharmacyId pointing to the User id (the pharmacy owner)
        const orders = yield db_1.prisma.order.findMany({
            where: { pharmacyId: req.user.id },
            include: { user: { select: { id: true, name: true, email: true, phone: true } } },
            orderBy: { createdAt: "desc" }
        });
        const mapped = orders.map(o => (Object.assign(Object.assign({}, o), { _id: o.id, userId: Object.assign(Object.assign({}, o.user), { _id: o.user.id }) })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getIncomingOrders = getIncomingOrders;
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield db_1.prisma.order.findUnique({ where: { id: req.params.id } });
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        // Allow if ADMIN or if user is the PHARMACY_OWNER of this pharmacy
        if (req.user.role !== "ADMIN") {
            const pharmacy = yield db_1.prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
            if (!pharmacy || order.pharmacyId !== req.user.id) {
                res.status(403).json({ message: "Not authorized to update this order" });
                return;
            }
        }
        const updatedOrder = yield db_1.prisma.order.update({
            where: { id: req.params.id },
            data: { status: req.body.status }
        });
        res.json(Object.assign(Object.assign({}, updatedOrder), { _id: updatedOrder.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
});
exports.updateOrderStatus = updateOrderStatus;
