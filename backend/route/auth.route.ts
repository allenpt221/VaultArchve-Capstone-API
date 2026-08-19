import express from 'express';
import { ChangePassword, deleteUser, forgotPassword, getProfile, getUsers, Login, Logout, resetPassword, Signup, toggleStudentStatus, updateAvatar, updateProfile } from '../controller/auth.controller';
import { adminOnly, verifyToken } from '../middleware/middware';
import multer from 'multer';


const route = express.Router();

const upload = multer({ storage: multer.memoryStorage() });


route.post('/signup', Signup);
route.post('/login', Login);
route.get('/getuser', verifyToken, adminOnly, getUsers);
route.post('/logout', verifyToken, Logout);
route.get('/profile', verifyToken, getProfile);
route.post('/forgot-password', forgotPassword);
route.post('/reset-password', resetPassword);
route.post("/change-password", verifyToken, ChangePassword);
route.put("/update-details", verifyToken, updateProfile);


route.put("/avatar", verifyToken, upload.single("avatar"), updateAvatar);

route.delete('/delete/:id', verifyToken, adminOnly, deleteUser);
route.put('/disable/:id', verifyToken, adminOnly, toggleStudentStatus);






export default route;