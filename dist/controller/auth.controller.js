"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = void 0;
exports.Signup = Signup;
exports.Login = Login;
exports.Logout = Logout;
exports.getUsers = getUsers;
exports.getProfile = getProfile;
exports.deleteUser = deleteUser;
exports.toggleStudentStatus = toggleStudentStatus;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.ChangePassword = ChangePassword;
exports.updateAvatar = updateAvatar;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const supa_client_1 = require("../supabase/supa-client");
const ioredis_1 = __importDefault(require("../lib/ioredis"));
const uuid_1 = require("uuid");
const ratelimit_1 = require("../lib/ratelimit");
const resetPassword_1 = require("../lib/resetPassword");
const cache_1 = require("../lib/cache");
const registedEmail_1 = require("../lib/registedEmail");
const cloudinary_1 = __importDefault(require("../lib/cloudinary"));
async function Signup(req, res) {
    try {
        const { email, firstname, lastname, password, program } = req.body;
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
                program,
                profile: null,
                role: "student"
            }
        ])
            .select("id, email, firstname, lastname, role, status, program") // exclude password
            .single();
        if (error) {
            console.error('Supabase error:', error);
            res.status(500).json({ error: 'Failed to create user' });
            return;
        }
        // invalidate cached user pages so the new user shows up immediately
        await (0, cache_1.invalidateCacheByPrefix)("users:page");
        (0, registedEmail_1.sendWelcomeEmail)(insertedUser.email, `${insertedUser.firstname} ${insertedUser.lastname}`, password // the original plaintext, still in scope from req.body
        ).catch((emailError) => {
            console.error("Welcome email failed to send:", emailError);
        });
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
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required.", success: false });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
        // Per-account limit (strict) + per-IP backstop (loose), checked together
        const [emailLimit, ipLimit] = await Promise.all([
            ratelimit_1.loginLimiter.limit(normalizedEmail),
            ratelimit_1.loginIpLimiter.limit(ip),
        ]);
        if (!emailLimit.success || !ipLimit.success) {
            const reset = Math.max(emailLimit.reset, ipLimit.reset);
            return res.status(429).json({
                success: false,
                message: "Too many login attempts. Please try again later.",
                retryAfter: Math.ceil((reset - Date.now()) / 1000) + " seconds",
            });
        }
        if (password.length < 8) {
            res.status(401).json({ message: "Password must be at least 8 characters.", success: false });
            return;
        }
        const { data: user, error } = await supa_client_1.supabase
            .from("Authentication")
            .select("*")
            .eq("email", normalizedEmail)
            .single();
        if (error || !user) {
            console.log("Invalid credentials");
            res.status(401).json({ message: "Invalid credentials", success: false });
            return;
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            console.log("Invalid credentials");
            return res.status(401).json({ message: "Invalid credentials", success: false });
        }
        const accessToken = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            firstname: user.firstname,
            lastname: user.lastname,
            middleInitial: user.middleInitial,
            gender: user.gender,
            contactNumber: user.contactNumber,
            addressLine: user.addressLine,
            barangay: user.barangay,
            municipality: user.municipality,
            province: user.province,
            program: user.program,
            profile: user.profile,
        }, process.env.JWT_SECRET, { expiresIn: "1h" });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, status: user.status, firstname: user.firstname, lastname: user.lastname, program: user.program, profile: user.profile }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 1000,
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: "Login successful",
            success: true,
            user: {
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role,
                program: user.program,
                status: user.status,
                profile: user.profile,
            },
        });
    }
    catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Internal server error" });
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
        const { page, limit, search } = req.query;
        if (!page || !limit) {
            return res.status(400).json({
                success: false,
                message: 'page and limit are required'
            });
        }
        const searchTerm = search?.trim() || '';
        // Only cache unfiltered pages — searches hit Supabase directly
        const cacheKey = searchTerm
            ? null
            : `users:page:${page}:limit:${limit}`;
        if (cacheKey) {
            const cached = await ioredis_1.default.get(cacheKey);
            if (cached) {
                return res.status(200).json({ success: true, users: cached });
            }
        }
        const from = (Number(page) - 1) * Number(limit);
        const to = from + Number(limit) - 1;
        let query = supa_client_1.supabase
            .from("Authentication")
            .select("id, email, firstname, lastname, role, status, created_at", { count: "exact" });
        if (searchTerm) {
            query = query.or(`firstname.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`);
        }
        const { data, error, count } = await query
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
        if (cacheKey) {
            await ioredis_1.default.set(cacheKey, responseData, { ex: 3600 });
        }
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
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized, Please Log in" });
        }
        const { data: user, error } = await supa_client_1.supabase
            .from("Authentication")
            .select("id, email, firstname, lastname, middleInitial, gender, contactNumber, addressLine, barangay, municipality, province, role, status, program, profile")
            .eq("id", userId)
            .single();
        if (error || !user) {
            console.error("getProfile Supabase error:", error);
            return res.status(404).json({ message: "User not found" });
        }
        return res.json(user);
    }
    catch (error) {
        console.error("getProfile error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "ID is required" });
        }
        // Delete dependent thesisRecommendation rows first to avoid FK violation
        const { error: recError } = await supa_client_1.supabase
            .from("thesisRecommendation")
            .delete()
            .eq("user_id", id);
        if (recError) {
            return res.status(500).json({ error: recError.message });
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
        await (0, cache_1.invalidateCacheByPrefix)("users:page");
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
        await (0, cache_1.invalidateCacheByPrefix)("users:page");
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
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const { data: user, error } = await supa_client_1.supabase
            .from("Authentication")
            .select("id, email")
            .eq("email", normalizedEmail)
            .single();
        // Always return a generic success message, even if the user doesn't
        // exist — prevents this endpoint from being used to enumerate emails.
        if (error || !user) {
            return res.status(200).json({
                message: "If an account with that email exists, a reset link has been sent.",
            });
        }
        const rawToken = (0, uuid_1.v4)();
        const hashedToken = await bcrypt_1.default.hash(rawToken, 10);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min, matches email copy
        const { error: updateError } = await supa_client_1.supabase
            .from("Authentication")
            .update({
            reset_token: hashedToken,
            reset_token_expires_at: expiresAt.toISOString(),
        })
            .eq("id", user.id);
        if (updateError) {
            console.error("Failed to store reset token:", updateError);
            return res.status(500).json({ message: "Internal server error" });
        }
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&id=${user.id}`;
        await (0, resetPassword_1.sendResetPasswordEmail)(user.email, resetLink);
        return res.status(200).json({
            message: "If an account with that email exists, a reset link has been sent.",
        });
    }
    catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
async function resetPassword(req, res) {
    try {
        const { id, token, password, confirmPassword } = req.body;
        if (!id || !token || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long",
            });
        }
        const { data: user, error } = await supa_client_1.supabase
            .from("Authentication")
            .select("id, reset_token, reset_token_expires_at")
            .eq("id", id)
            .single();
        if (error || !user || !user.reset_token) {
            return res.status(400).json({ message: "Invalid or expired reset link" });
        }
        const isExpired = !user.reset_token_expires_at ||
            new Date(user.reset_token_expires_at).getTime() < Date.now();
        if (isExpired) {
            return res.status(400).json({ message: "Reset link has expired" });
        }
        const isValidToken = await bcrypt_1.default.compare(token, user.reset_token);
        if (!isValidToken) {
            return res.status(400).json({ message: "Invalid or expired reset link" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const { error: updateError } = await supa_client_1.supabase
            .from("Authentication")
            .update({
            password: hashedPassword,
            reset_token: null,
            reset_token_expires_at: null,
        })
            .eq("id", id);
        if (updateError) {
            console.error("Failed to update password:", updateError);
            return res.status(500).json({ message: "Internal server error" });
        }
        return res.status(200).json({ message: "Password has been reset successfully" });
    }
    catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function ChangePassword(req, res) {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized, Please Log in" });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are both required",
                success: false,
            });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must be at least 8 characters",
                success: false,
            });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different from your current password",
                success: false,
            });
        }
        // Fetch the user's current hashed password to verify against
        const { data: user, error: fetchError } = await supa_client_1.supabase
            .from("Authentication")
            .select("id, password")
            .eq("id", user_id)
            .single();
        if (fetchError || !user) {
            console.error("Supabase fetch error:", fetchError);
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
                success: false,
            });
        }
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 10);
        const { error: updateError } = await supa_client_1.supabase
            .from("Authentication")
            .update({ password: hashedNewPassword })
            .eq("id", user_id);
        if (updateError) {
            console.error("Supabase update error:", updateError);
            return res.status(500).json({ message: "Failed to update password" });
        }
        return res.status(200).json({
            message: "Password changed successfully",
            success: true,
        });
    }
    catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { firstname, lastname, middleInitial, gender, contactNumber, addressLine, barangay, municipality, province, } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!firstname?.trim() || !lastname?.trim()) {
            return res.status(400).json({ error: "First and last name are required" });
        }
        const toNullable = (v) => {
            const trimmed = v?.trim();
            return trimmed ? trimmed : null;
        };
        const { data: updatedUser, error: updateError } = await supa_client_1.supabase
            .from("Authentication")
            .update({
            firstname: firstname.trim(),
            middleInitial: toNullable(middleInitial),
            lastname: lastname.trim(),
            gender: toNullable(gender),
            contactNumber: toNullable(contactNumber),
            addressLine: toNullable(addressLine),
            barangay: toNullable(barangay),
            municipality: toNullable(municipality),
            province: toNullable(province),
        })
            .eq("id", userId)
            .select()
            .single();
        if (updateError) {
            return res.status(500).json({ error: "Failed to update profile", updateError });
        }
        await (0, cache_1.invalidateCacheByPrefix)("users:page");
        return res.status(200).json({ user: updatedUser });
    }
    catch (err) {
        console.error("updateProfile error:", err);
        return res.status(500).json({ error: "Something went wrong" });
    }
};
exports.updateProfile = updateProfile;
// Uploads the incoming file (from multer's memoryStorage — req.file.buffer)
// to Cloudinary as a base64 data URI, then saves the resulting URL on the
// "profile" column. No stream / streamifier needed.
async function uploadBufferToCloudinary(buffer, mimetype, publicId) {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    return cloudinary_1.default.uploader.upload(dataUri, {
        folder: "vaultarchve/avatars",
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
    });
}
async function updateAvatar(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized, Please Log in", success: false });
        }
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "No image file provided", success: false });
        }
        const uploadResult = await uploadBufferToCloudinary(file.buffer, file.mimetype, `user_${userId}`);
        const { data: updatedUser, error: updateError } = await supa_client_1.supabase
            .from("Authentication")
            .update({ profile: uploadResult.secure_url })
            .eq("id", userId)
            .select("id, email, firstname, lastname, role, status, program, profile")
            .single();
        if (updateError || !updatedUser) {
            console.error("Supabase error:", updateError);
            return res.status(500).json({ message: "Failed to save profile photo", success: false });
        }
        await (0, cache_1.invalidateCacheByPrefix)("users:page");
        return res.status(200).json({
            message: "Profile photo updated",
            success: true,
            profileUrl: uploadResult.secure_url,
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("updateAvatar error:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}
