import express from 'express';
import { deleteUser, forgotPassword, getProfile, getUsers, Login, Logout, resetPassword, Signup, toggleStudentStatus } from '../controller/auth.controller';
import { adminOnly, verifyToken } from '../middleware/middware';
import { loginLimiter } from '../lib/ratelimit';


const route = express.Router();

route.post('/signup', Signup);
route.post('/login', Login);
route.get('/getuser', verifyToken, adminOnly, getUsers);
route.post('/logout', verifyToken, Logout);
route.get('/profile', verifyToken, getProfile);
route.post('/forgot-password', forgotPassword);
route.post('/reset-password', resetPassword);


route.delete('/delete/:id', verifyToken, adminOnly, deleteUser);
route.put('/disable/:id', verifyToken, adminOnly, toggleStudentStatus);






export default route;