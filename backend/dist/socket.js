"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on("connection", (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        // Pharmacies join a room representing their pharmacyId
        socket.on("join_pharmacy", (pharmacyId) => {
            console.log(`🏥 Socket ${socket.id} joined pharmacy room: ${pharmacyId}`);
            socket.join(pharmacyId);
        });
        // Patients join a room representing their patientId
        socket.on("join_patient", (patientId) => {
            console.log(`👤 Socket ${socket.id} joined patient room: ${patientId}`);
            socket.join(patientId);
        });
        // Doctors join a room representing their doctorId
        socket.on("join_doctor", (doctorId) => {
            console.log(`🥼 Socket ${socket.id} joined doctor room: ${doctorId}`);
            socket.join(doctorId);
        });
        socket.on("disconnect", () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
exports.getIO = getIO;
