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
exports.updateMyPharmacy = exports.getMyPharmacy = exports.deletePharmacy = exports.updatePharmacy = exports.createPharmacy = exports.getPharmacies = void 0;
const db_1 = require("../config/db");
const getPharmacies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // PostgreSQL doesn't have $near geospatial by default, so return all pharmacies
        const pharmacies = yield db_1.prisma.pharmacy.findMany({
            include: { user: { select: { name: true } } }
        });
        const mapped = pharmacies.map(p => (Object.assign(Object.assign({}, p), { _id: p.id })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
exports.getPharmacies = getPharmacies;
const createPharmacy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existing = yield db_1.prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
        if (existing && req.user.role !== "ADMIN") {
            res.status(400).json({ message: "You already have a pharmacy registered" });
            return;
        }
        const ownerId = req.user.role === "ADMIN" ? (req.body.ownerId || req.user.id) : req.user.id;
        const pharmacy = yield db_1.prisma.pharmacy.create({
            data: {
                name: req.body.name,
                address: req.body.address,
                phone: req.body.phone,
                email: req.body.email,
                userId: ownerId
            }
        });
        res.status(201).json(Object.assign(Object.assign({}, pharmacy), { _id: pharmacy.id }));
    }
    catch (error) {
        res.status(400).json({ message: "Invalid data", error: error.message });
    }
});
exports.createPharmacy = createPharmacy;
const updatePharmacy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const pharmacy = yield db_1.prisma.pharmacy.update({
            where: { id },
            data: {
                name: req.body.name,
                address: req.body.address,
                phone: req.body.phone,
                email: req.body.email
            }
        });
        res.json(Object.assign(Object.assign({}, pharmacy), { _id: pharmacy.id }));
    }
    catch (error) {
        res.status(400).json({ message: "Update failed", error: error.message });
    }
});
exports.updatePharmacy = updatePharmacy;
const deletePharmacy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield db_1.prisma.pharmacy.delete({ where: { id } });
        res.json({ message: "Pharmacy deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
});
exports.deletePharmacy = deletePharmacy;
const getMyPharmacy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pharmacy = yield db_1.prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
        if (!pharmacy) {
            res.status(404).json({ message: "No pharmacy found for this owner" });
            return;
        }
        res.json(Object.assign(Object.assign({}, pharmacy), { _id: pharmacy.id }));
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
exports.getMyPharmacy = getMyPharmacy;
const updateMyPharmacy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pharmacy = yield db_1.prisma.pharmacy.update({
            where: { userId: req.user.id },
            data: {
                name: req.body.name,
                address: req.body.address,
                phone: req.body.phone,
                email: req.body.email
            }
        });
        res.json(Object.assign(Object.assign({}, pharmacy), { _id: pharmacy.id }));
    }
    catch (error) {
        res.status(400).json({ message: "Update failed", error: error.message });
    }
});
exports.updateMyPharmacy = updateMyPharmacy;
