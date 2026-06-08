import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const seedData = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL for seeding...");

    // 1. Clear existing data (order matters due to foreign keys)
    await prisma.pharmacyPrescription.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.medicine.deleteMany();
    await prisma.pharmacy.deleteMany();
    await prisma.user.deleteMany();
    console.log("🗑️  Cleared existing data.");

    // 2. Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const admin = await prisma.user.create({
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
    const ownerPassword = await bcrypt.hash("password123", salt);
    const pharmacyOwner = await prisma.user.create({
      data: {
        name: "Pharmacy Owner",
        email: "owner@pharmasmart.com",
        password: ownerPassword,
        phone: "0987654321",
        role: "PHARMACY_OWNER"
      }
    });

    // 4. Create Doctor
    const doctorPassword = await bcrypt.hash("password123", salt);
    const doctor = await prisma.user.create({
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
    const customerPassword = await bcrypt.hash("password123", salt);
    const customer = await prisma.user.create({
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
    const pharmacy1 = await prisma.pharmacy.create({
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
    await prisma.medicine.createMany({
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
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
