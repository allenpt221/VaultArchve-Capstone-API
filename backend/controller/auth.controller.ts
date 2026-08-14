import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase } from '../supabase/supa-client';
import { Request, Response } from 'express';
import redis from '../lib/ioredis';
import { v4 as uuidv4 } from 'uuid';

import { loginIpLimiter, loginLimiter } from '../lib/ratelimit';
import { sendResetPasswordEmail } from '../lib/resetPassword';
import { invalidateCacheByPrefix } from '../lib/cache';
import { sendWelcomeEmail } from '../lib/registedEmail';



interface User {
    id?: string;
    email: string;
    firstname: string;
    lastname: string;
    password: string;
    role: string;
    status:string;
}

export async function Signup(req: Request, res: Response) {
    try {
        const { email, firstname, lastname, password, role }: User = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (!gmailRegex.test(email)) {
          return res.status(400).json({
            message: "Only @gmail.com email addresses are allowed",
            success: false
          });
        }

        const { data: ExistingUser, error: findError } = await supabase
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

        const { data: insertedUser, error } = await supabase
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
              return
        }

        // invalidate cached user pages so the new user shows up immediately
        await invalidateCacheByPrefix("users:page");


        sendWelcomeEmail(
            insertedUser.email,
            `${insertedUser.firstname} ${insertedUser.lastname}`,
            password  // the original plaintext, still in scope from req.body
          ).catch((emailError) => {
            console.error("Welcome email failed to send:", emailError);
          });

        res.status(201).json({
              message: 'User created successfully',
              user: insertedUser 
          });

    } catch (error: any) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error'})
        return
    }
}

export async function Login(req: Request, res: Response) {
  try {
    const { email, password }: User = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required.", success: false });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";

    // Per-account limit (strict) + per-IP backstop (loose), checked together
    const [emailLimit, ipLimit] = await Promise.all([
      loginLimiter.limit(normalizedEmail),
      loginIpLimiter.limit(ip),
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

    const { data: user, error } = await supabase
      .from("Authentication")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (error || !user) {
      console.log("Invalid credentials");
      res.status(401).json({ message: "Invalid credentials", success: false });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials", success: false });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "7d" }
    );

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
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

export async function Logout(req: Request, res: Response) {
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
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
    return
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { page, limit } = req.query as { page: string; limit: string };

    if (!page || !limit) {
      return res.status(400).json({
        success: false,
        message: 'page and limit are required'
      });
    }

    const cacheKey = `users:page:${page}:limit:${limit}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, users: cached }); 
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data, error, count } = await supabase
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
      totalPages: Math.ceil(count! / Number(limit)),
    };

    await redis.set(cacheKey, responseData, { ex: 3600 });

    return res.status(200).json({
      success: true,
      users: responseData,
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getProfile(req: Request, res: Response){
  try {
    res.json(req.user);
  } catch (error:any) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Delete dependent thesisRecommendation rows first to avoid FK violation
    const { error: recError } = await supabase
      .from("thesisRecommendation")
      .delete()
      .eq("user_id", id);

    if (recError) {
      return res.status(500).json({ error: recError.message });
    }

    const { data, error } = await supabase
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
    await invalidateCacheByPrefix("users:page");

    return res.status(200).json({
      message: "User deleted successfully",
      deleted: data,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}

export async function toggleStudentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const { data: existing, error: fetchError } = await supabase
      .from("Authentication")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const nextStatus = existing.status === "disabled" ? "active" : "disabled";

    const { data, error } = await supabase
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
    await invalidateCacheByPrefix("users:page");

    return res.status(200).json({
      success: true,
      message: `Student ${nextStatus} successfully`,
      user: data,
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error } = await supabase
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

    const rawToken = uuidv4();
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min, matches email copy

    const { error: updateError } = await supabase
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

    await sendResetPasswordEmail(user.email, resetLink);

    return res.status(200).json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function resetPassword(req: Request, res: Response) {
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

    const { data: user, error } = await supabase
      .from("Authentication")
      .select("id, reset_token, reset_token_expires_at")
      .eq("id", id)
      .single();

    if (error || !user || !user.reset_token) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const isExpired =
      !user.reset_token_expires_at ||
      new Date(user.reset_token_expires_at).getTime() < Date.now();

    if (isExpired) {
      return res.status(400).json({ message: "Reset link has expired" });
    }

    const isValidToken = await bcrypt.compare(token, user.reset_token);

    if (!isValidToken) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabase
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
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


export async function ChangePassword(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

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
    const { data: user, error: fetchError } = await supabase
      .from("Authentication")
      .select("id, password")
      .eq("id", user_id)
      .single();

    if (fetchError || !user) {
      console.error("Supabase fetch error:", fetchError);
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
        success: false,
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
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
  } catch (error: any) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}