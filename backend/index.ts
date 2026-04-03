import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';

import AuthRouter from './route/auth.route';
import RepoRouter from './route/repository.route';
import AiRouter from './route/generativeAI.router';




dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
     origin: 'http://localhost:3000', // frontend origin
     credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = process.env.PORT;


app.use('/api/auth', AuthRouter);
app.use('/api/repository', RepoRouter);
app.use('/api/ai', AiRouter);




app.listen(PORT, () => {
     console.log(`🚀 Server running on http://localhost:${PORT}`);
})
