import express from 'express';
import { ChangePassword, deleteUser, forgotPassword, getProfile, getUsers, Login, Logout, resetPassword, Signup, toggleStudentStatus, updateAvatar, updateProfile } from '../controller/auth.controller';
import { adminOnly, verifyToken } from '../middleware/middware';
import multer from 'multer';


const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });


router.post('/signup', Signup);
router.post('/login', Login);
router.get('/getuser', verifyToken, adminOnly, getUsers);
router.post('/logout', verifyToken, Logout);
router.get('/profile', verifyToken, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post("/change-password", verifyToken, ChangePassword);
router.put("/update-details", verifyToken, updateProfile);


router.put("/avatar", verifyToken, upload.single("avatar"), updateAvatar);

router.delete('/delete/:id', verifyToken, adminOnly, deleteUser);
router.put('/disable/:id', verifyToken, adminOnly, toggleStudentStatus);






export default router;