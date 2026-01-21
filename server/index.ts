import express from 'express';
import ViteExpress from 'vite-express';
import { router } from './routes';
import { initStorage } from './storage';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize storage
initStorage();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', router);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server with Vite in development
ViteExpress.listen(app, PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
