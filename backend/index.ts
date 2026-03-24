import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import AuthRouter from './route/auth.route';
import RepoRouter from './route/repository.route';



dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT;


app.use('/api/auth', AuthRouter);
app.use('/api/repository', RepoRouter);



app.listen(PORT, () => {
     console.log(`🚀 Server running on http://localhost:${PORT}`);
})
