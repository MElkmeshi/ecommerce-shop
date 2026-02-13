import { Router } from 'express';
import { createOrder, getUserOrders } from '../controllers/orders.controller';
import { telegramAuthMiddleware } from '../middleware/telegramAuth';

const router = Router();

// All order routes require Telegram authentication
router.post('/orders', telegramAuthMiddleware, createOrder);
router.get('/orders', telegramAuthMiddleware, getUserOrders);

export default router;
