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
exports.getMyMedicines = exports.deleteMedicine = exports.createMedicine = exports.updateMedicine = exports.getMedicines = void 0;
const db_1 = require("../config/db");
const getMedicines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const medicines = yield db_1.prisma.medicine.findMany({
            include: { pharmacy: { select: { id: true, name: true, address: true } } }
        });
        const mapped = medicines.map(m => {
            var _a;
            return (Object.assign(Object.assign({}, m), { _id: m.id, pharmacyId: m.pharmacy ? Object.assign(Object.assign({}, m.pharmacy), { _id: m.pharmacy.id }) : null, pharmacyName: ((_a = m.pharmacy) === null || _a === void 0 ? void 0 : _a.name) || "Standard Pharmacy", stockQuantity: m.stock }));
        });
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
exports.getMedicines = getMedicines;
const updateMedicine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params.id;
        const medicine = yield db_1.prisma.medicine.update({
            where: { id },
            data: {
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                category: req.body.category,
                stock: (_a = req.body.stock) !== null && _a !== void 0 ? _a : req.body.stockQuantity,
                requiresPrescription: req.body.requiresPrescription,
                image: req.body.image
            }
        });
        res.json(Object.assign(Object.assign({}, medicine), { _id: medicine.id, stockQuantity: medicine.stock }));
    }
    catch (error) {
        res.status(400).json({ message: "Update failed", error: error.message });
    }
});
exports.updateMedicine = updateMedicine;
const createMedicine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const medicine = yield db_1.prisma.medicine.create({
            data: {
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                category: req.body.category,
                stock: (_b = (_a = req.body.stock) !== null && _a !== void 0 ? _a : req.body.stockQuantity) !== null && _b !== void 0 ? _b : 0,
                requiresPrescription: req.body.requiresPrescription || false,
                image: req.body.image,
                pharmacyId: req.body.pharmacyId
            }
        });
        res.status(201).json(Object.assign(Object.assign({}, medicine), { _id: medicine.id, stockQuantity: medicine.stock }));
    }
    catch (error) {
        res.status(400).json({ message: "Invalid data", error: error.message });
    }
});
exports.createMedicine = createMedicine;
const deleteMedicine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield db_1.prisma.medicine.delete({ where: { id } });
        res.json({ message: "Medicine deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
});
exports.deleteMedicine = deleteMedicine;
const getMyMedicines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pharmacyId = req.params.pharmacyId;
        const medicines = yield db_1.prisma.medicine.findMany({
            where: { pharmacyId },
            include: { pharmacy: { select: { id: true, name: true } } }
        });
        const mapped = medicines.map(m => (Object.assign(Object.assign({}, m), { _id: m.id, pharmacyId: m.pharmacy ? Object.assign(Object.assign({}, m.pharmacy), { _id: m.pharmacy.id }) : null, stockQuantity: m.stock })));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
exports.getMyMedicines = getMyMedicines;
