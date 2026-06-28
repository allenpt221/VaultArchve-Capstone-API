"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controller/auth.controller");
const middware_1 = require("../middleware/middware");
const route = express_1.default.Router();
route.post('/signup', auth_controller_1.Signup);
route.post('/login', auth_controller_1.Login);
route.get('/getuser', middware_1.verifyToken, middware_1.adminOnly, auth_controller_1.getUsers);
route.post('/logout', middware_1.verifyToken, auth_controller_1.Logout);
route.get('/profile', middware_1.verifyToken, auth_controller_1.getProfile);
route.delete('/delete/:id', middware_1.verifyToken, middware_1.adminOnly, auth_controller_1.deleteUser);
route.put('/disable/:id', middware_1.verifyToken, middware_1.adminOnly, auth_controller_1.toggleStudentStatus);
exports.default = route;
