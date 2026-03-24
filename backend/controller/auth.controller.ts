import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase } from '../supabase/supa-client';
import { Request, Response } from 'express';


interface User {
    id?: string;
    email: string;
    firstname: string;
    lastname: string;
    password: string;
    role: string;
}


export async function  Signup(req:Request, res:Response) {
    try {
        const { email, firstname, lastname, password, role }: User = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);


        const { data: ExistingUser, error: findError } = await supabase
        .from("Authentication")
        .select("email")
        .eq("email", email);

        if (findError) {
        return res.status(500).json({ error: "Database error" });
        }

        if (ExistingUser && ExistingUser.length > 0) {
        return res.status(400).json({
            error: "Email already registered"
        });
        }

        const { error } = await supabase
        .from('Authentication')
        .insert([
            {
                email,
                firstname,
                lastname,
                password: hashedPassword,
                role: "student"
            }
        ]);

        if (error) {
              console.error('Supabase error:', error);
              res.status(500).json({ error: 'Failed to create user' });
              return
        }

        res.status(201).json({
              message: 'User created successfully',
              user: {
                  email,
                  firstname,
                  lastname,
                  role
              }
          });

    } catch (error: any) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error'})
        return
    }
}

export async function Login(req: Request, res: Response){
    try {
        const { email, password }: User = req.body; 

        const normalizedEmail = email.trim().toLowerCase();

        const {data: user, error } = await supabase
        .from("Authentication")
        .select("*")
        .eq("email", normalizedEmail)
        .single();

        if(error || !user){
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }


        const passwordMatch = await bcrypt.compare(password, user.password);

        if(!passwordMatch){
            return res.json({message: "Invalid credentials'"})
        }


        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "15m" }
        );


        const refreshToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: "7d" }
        );

        res.cookie("accessToken", accessToken, {
        httpOnly: true,       
        secure: process.env.NODE_ENV === 'production',        
        sameSite: "strict",
        maxAge: 15 * 60 * 1000
        });

        res.cookie("refreshToken", refreshToken, {
        httpOnly: true,       
        secure: process.env.NODE_ENV === 'production',        
        sameSite: "strict",
        maxAge: 60 * 60 * 1000 
        });

        res.status(200).json({
        message: "Login successful",
        user: {
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role
        }
        });

    } catch (error:any) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error'})
        return
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
    const { data, error } = await supabase
      .from("Authentication")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Return all users
    return res.status(200).json({ users: data });
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
