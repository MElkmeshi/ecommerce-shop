import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { bot } from './bot';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Telegram E-commerce API' });
});

app.use('/api', productsRoutes);
app.use('/api', ordersRoutes);
app.use('/api', adminRoutes);

// Start Express server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Launch Telegram bot
bot.launch()
  .then(() => {
    console.log('✅ Telegram bot launched successfully');
  })
  .catch((err) => {
    console.error('❌ Failed to launch bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit(0);
});

export default app;
