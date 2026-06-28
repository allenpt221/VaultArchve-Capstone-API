"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signup = Signup;
exports.Login = Login;
exports.Logout = Logout;
exports.getUsers = getUsers;
exports.getProfile = getProfile;
exports.deleteUser = deleteUser;
exports.toggleStudentStatus = toggleStudentStatus;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const supa_client_1 = require("../supabase/supa-client");
const ioredis_1 = __importDefault(require("../lib/ioredis"));
const ratelimit_1 = require("../lib/ratelimit");
async function Signup(req, res) {
    try {
        const { email, firstname, lastname, password, role } = req.body;
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(email)) {
            return res.status(400).json({
                message: "Only @gmail.com email addresses are allowed",
                success: false
            });
        }
        const { data: ExistingUser, error: findError } = await supa_client_1.supabase
            .from("Authentication")
            .select("email")
            .eq("email", email);
        if (findError) {
            return res.status(500).json({ error: "Database error" });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters', success: false });
        }
        if (ExistingUser && ExistingUser.length > 0) {
            return res.status(400).json({
                error: "Email already registered"
            });
        }
        const { data: insertedUser, error } = await supa_client_1.supabase
            .from('Authentication')
            .insert([
            {
                email,
                firstname,
                lastname,
                password: hashedPassword,
                role: "student"
            }
        ])
            .select("id, email, firstname, lastname, role, status") // exclude password
            .single();
        if (error) {
            console.error('Supabase error:', error);
            res.status(500).json({ error: 'Failed to create user' });
            return;
        }
        // invalidate cached user pages so the new user shows up immediately
        const keys = await ioredis_1.default.keys("users:page:*");
        if (keys.length > 0) {
            await ioredis_1.default.del(...keys);
        }
        res.status(201).json({
            message: 'User created successfully',
            user: insertedUser
        });
    }
    catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}
async function Login(req, res) {
    try {
        const { email, password } = req.body;
        const ip = req.ip || req.headers["x-forwarded-for"];
        const { success, reset } = await ratelimit_1.loginLimiter.limit(ip);
        if (!success) {
            return res.status(429).json({
                success: false,
                message: "You have been timed out. Please try again later.",
                retryAfter: Math.ceil((reset - Date.now()) / 1000) + " seconds",
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const { data: user, error } = await supa_client_1.supabase
            .from("Authentication")
            .select("*")
            .eq("email", normalizedEmail)
            .single();
        if (password.length < 8) {
            res.status(401).json({ message: "Password must be at least 8 characters.", success: false });
            return;
        }
        if (error || !user) {
            console.log("Invalid credentials");
            res.status(401).json({ message: 'Invalid credentials', success: false });
            return;
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            console.log("Invalid credentials");
            return res.status(401).json({ message: "Invalid credentials", success: false });
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
            maxAge: 60 * 60 * 1000
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: "Login successful",
            success: true,
            user: {
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}
async function Logout(req, res) {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Internal server error" });
        return;
    }
}
async function getUsers(req, res) {
    try {
        const { page, limit } = req.query;
        if (!page || !limit) {
            return res.status(400).json({
                success: false,
                message: 'page and limit are required'
            });
        }
        const cacheKey = `users:page:${page}:limit:${limit}`;
        const cached = await ioredis_1.default.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, users: cached });
        }
        const from = (Number(page) - 1) * Number(limit);
        const to = from + Number(limit) - 1;
        const { data, error, count } = await supa_client_1.supabase
            .from("Authentication")
            .select("id, email, firstname, lastname, role, status, created_at", { count: "exact" })
            .order("created_at", { ascending: true })
            .range(from, to);
        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: "Failed to fetch users" });
        }
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        const responseData = {
            users: data,
            totalCount: count,
            currentPage: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
        };
        await ioredis_1.default.set(cacheKey, responseData, { ex: 3600 });
        return res.status(200).json({
            success: true,
            users: responseData,
        });
    }
    catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function getProfile(req, res) {
    try {
        res.json(req.user);
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Internal server error" });
        return;
    }
}
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "ID is required" });
        }
        const { data, error } = await supa_client_1.supabase
            .from("Authentication")
            .delete()
            .eq("id", id)
            .select();
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if (!data || data.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        // Invalidate cached user pages so the deletion shows up immediately,
        // instead of waiting out the 1-hour TTL on the stale page.
        const staleKeys = await ioredis_1.default.keys("users:page:*");
        if (staleKeys.length > 0) {
            await ioredis_1.default.del(...staleKeys);
        }
        return res.status(200).json({
            message: "User deleted successfully",
            deleted: data,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || "Internal server error",
        });
    }
}
async function toggleStudentStatus(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "ID is required" });
        }
        const { data: existing, error: fetchError } = await supa_client_1.supabase
            .from("Authentication")
            .select("status")
            .eq("id", id)
            .single();
        if (fetchError || !existing) {
            return res.status(404).json({ message: "User not found" });
        }
        const nextStatus = existing.status === "disabled" ? "active" : "disabled";
        const { data, error } = await supa_client_1.supabase
            .from("Authentication")
            .update({ status: nextStatus })
            .eq("id", id)
            .select()
            .single();
        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: "Failed to update status" });
        }
        if (!data) {
            return res.status(404).json({ message: "User not found" });
        }
        // Invalidate cached user pages so the new status shows up immediately,
        // instead of waiting out the 1-hour TTL on the stale page.
        const staleKeys = await ioredis_1.default.keys("users:page:*");
        if (staleKeys.length > 0) {
            await ioredis_1.default.del(...staleKeys);
        }
        return res.status(200).json({
            success: true,
            message: `Student ${nextStatus} successfully`,
            user: data,
        });
    }
    catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            error: error.message || "Internal server error",
        });
    }
}
