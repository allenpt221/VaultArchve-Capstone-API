import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

import AuthRouter from './route/auth.route';
import RepoRouter from './route/repository.route';
import AiRouter from './route/generativeAI.router';

dotenv.config();

const app = express();

const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(cors({
  origin: isProd ? false : 'http://localhost:3000',
  credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = process.env.PORT;

// ── API routes ──
app.use('/api/auth', AuthRouter);
app.use('/api/repository', RepoRouter);
app.use('/api/ai', AiRouter);

// ── Serve Next.js static export in production ──
if (isProd) {
  const frontendPath = path.join(__dirname, '../frontend/out');

  app.use(express.static(frontendPath));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.resolve(frontendPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});