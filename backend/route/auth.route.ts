import express from 'express';
import { getProfile, getUsers, Login, Logout, Signup } from '../controller/auth.controller';
import { adminOnly, verifyToken } from '../middleware/middware';
import { loginLimiter } from '../lib/ratelimit';


const route = express.Router();

route.post('/signup', Signup);
route.post('/login', Login);
route.get('/getuser', verifyToken, adminOnly, getUsers);
route.post('/logout', verifyToken, Logout);
route.get('/profile', verifyToken, getProfile);





export default route;