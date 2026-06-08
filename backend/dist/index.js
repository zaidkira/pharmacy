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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const socket_1 = require("./socket");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const pharmacyRoutes_1 = __importDefault(require("./routes/pharmacyRoutes"));
const medicineRoutes_1 = __importDefault(require("./routes/medicineRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const prescriptionRoutes_1 = __importDefault(require("./routes/prescriptionRoutes"));
const appointmentRoutes_1 = __importDefault(require("./routes/appointmentRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.io
(0, socket_1.initSocket)(httpServer);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve uploaded files statically
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../../uploads")));
// Serve static files from the built client app
app.use(express_1.default.static(path_1.default.join(__dirname, "../../dist")));
// Routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/pharmacies", pharmacyRoutes_1.default);
app.use("/api/medicines", medicineRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/upload", uploadRoutes_1.default);
app.use("/api/prescriptions", prescriptionRoutes_1.default);
app.use("/api/appointments", appointmentRoutes_1.default);
// Fallback all other GET requests to client app routes
app.get("*splat", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../../dist/index.html"));
});
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.connectDB)();
    console.log(`🚀 Server running on port ${PORT}`);
}));
