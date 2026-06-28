import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

import AuthRouter from './route/auth.route';
import RepoRouter from './route/repository.route';
import AiRouter from './route/generativeAI.router';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const nextApp = require('next')({
  dev: !isProd,
  dir: path.join(__dirname, '../frontend'),
});

const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();

  app.use(express.json());
  app.use(cors({
    origin: isProd ? false : 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const PORT = process.env.PORT || 3000;

  // ── API routes ──
  app.use('/api/auth', AuthRouter);
  app.use('/api/repository', RepoRouter);
  app.use('/api/ai', AiRouter);

  // ── Next.js handles all non-API routes ──
  app.all(/^\/(?!api).*/, (req: any, res: any) => {
    return handle(req, res);
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});