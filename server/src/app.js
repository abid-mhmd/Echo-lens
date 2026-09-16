import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisRoutes from './routes/analysisRoutes.js';

// Explicitly load server/.env relative to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api', analysisRoutes);

// Sanitized Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err?.message || err);
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred. Please try again.',
  });
});

export default app;
