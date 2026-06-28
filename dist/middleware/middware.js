"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
exports.adminOnly = adminOnly;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function verifyToken(req, res, next) {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized Access. Please log in" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ✅ no "as any"
        next();
    }
    catch (error) {
        return res.status(403).json({ message: "Invalid token" });
    }
}
function adminOnly(req, res, next) {
    const user = req.user;
    if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
}
