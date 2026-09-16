import express from 'express';
import cors from 'cors';
import analysisRoutes from './routes/analysisRoutes.js';

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
