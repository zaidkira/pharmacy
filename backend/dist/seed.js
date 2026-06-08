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
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
dotenv_1.default.config();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const seedData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.$connect();
        console.log("✅ Connected to PostgreSQL for seeding...");
        // 1. Clear existing data (order matters due to foreign keys)
        yield prisma.pharmacyPrescription.deleteMany();
        yield prisma.prescription.deleteMany();
        yield prisma.appointment.deleteMany();
        yield prisma.order.deleteMany();
        yield prisma.medicine.deleteMany();
        yield prisma.pharmacy.deleteMany();
        yield prisma.user.deleteMany();
        console.log("🗑️  Cleared existing data.");
        // 2. Create Admin User
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash("password123", salt);
        const admin = yield prisma.user.create({
            data: {
                name: "Admin User",
                email: "admin@pharmasmart.com",
                password: hashedPassword,
                phone: "1234567890",
                role: "ADMIN"
            }
        });
        console.log("👤 Created Admin User.");
        // 3. Create Pharmacy Owner
        const ownerPassword = yield bcryptjs_1.default.hash("password123", salt);
        const pharmacyOwner = yield prisma.user.create({
            data: {
                name: "Pharmacy Owner",
                email: "owner@pharmasmart.com",
                password: ownerPassword,
                phone: "0987654321",
                role: "PHARMACY_OWNER"
            }
        });
        // 4. Create Doctor
        const doctorPassword = yield bcryptjs_1.default.hash("password123", salt);
        const doctor = yield prisma.user.create({
            data: {
                name: "Dr. Ahmed",
                email: "doctor@pharmasmart.com",
                password: doctorPassword,
                phone: "1112223333",
                role: "DOCTOR",
                specialization: "General Medicine",
                licenseNumber: "LIC-001",
                status: "ACTIVE",
                schedule: { days: ["Monday", "Wednesday", "Friday"], timeSlots: ["09:00", "10:00", "11:00", "14:00", "15:00"] }
            }
        });
        // 5. Create Customer
        const customerPassword = yield bcryptjs_1.default.hash("password123", salt);
        const customer = yield prisma.user.create({
            data: {
                name: "Customer User",
                email: "customer@pharmasmart.com",
                password: customerPassword,
                phone: "4445556666",
                role: "CUSTOMER"
            }
        });
        console.log("👤 Created Doctor, Pharmacy Owner, and Customer.");
        // 6. Create Pharmacies
        const pharmacy1 = yield prisma.pharmacy.create({
            data: {
                name: "HealthPlus Pharmacy",
                userId: pharmacyOwner.id,
                address: "123 Main Street, Downtown",
                phone: "+1 (555) 123-4567",
                email: "healthplus@pharmasmart.com"
            }
        });
        console.log("🏥 Created Pharmacy.");
        // 7. Create Medicines
        yield prisma.medicine.createMany({
            data: [
                {
                    name: "Paracetamol 500mg",
                    pharmacyId: pharmacyOwner.id,
                    category: "Pain Relief",
                    description: "Effective pain and fever relief",
                    price: 8.99,
                    stock: 100,
                    requiresPrescription: false
                },
                {
                    name: "Amoxicillin 250mg",
                    pharmacyId: pharmacyOwner.id,
                    category: "Antibiotics",
                    description: "Broad-spectrum antibiotic",
                    price: 15.99,
                    stock: 50,
                    requiresPrescription: true
                },
                {
                    name: "Vitamin D3 1000 IU",
                    pharmacyId: pharmacyOwner.id,
                    category: "Vitamins",
                    description: "Essential vitamin supplement",
                    price: 12.50,
                    stock: 200,
                    requiresPrescription: false
                },
                {
                    name: "Ibuprofen 400mg",
                    pharmacyId: pharmacyOwner.id,
                    category: "Pain Relief",
                    description: "Anti-inflammatory pain reliever",
                    price: 10.99,
                    stock: 75,
                    requiresPrescription: false
                }
            ]
        });
        console.log("💊 Created 4 Medicines.");
        console.log("✨ Seeding Complete!");
        console.log("\nLogin Credentials:");
        console.log("  Admin:    admin@pharmasmart.com / password123");
        console.log("  Owner:    owner@pharmasmart.com / password123");
        console.log("  Doctor:   doctor@pharmasmart.com / password123");
        console.log("  Customer: customer@pharmasmart.com / password123");
        // Close resources
        yield prisma.$disconnect();
        yield pool.end();
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
});
seedData();
