import { Router } from 'express';
import {
  adminLogin,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminOrders,
  createCategory,
} from '../controllers/admin.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = Router();

// Public admin route (no auth)
router.post('/admin/login', adminLogin);

// Protected admin routes (require JWT)
router.get('/admin/products', adminAuthMiddleware, getAdminProducts);
router.post('/admin/products', adminAuthMiddleware, createProduct);
router.put('/admin/products/:id', adminAuthMiddleware, updateProduct);
router.delete('/admin/products/:id', adminAuthMiddleware, deleteProduct);

router.get('/admin/orders', adminAuthMiddleware, getAdminOrders);

router.post('/admin/categories', adminAuthMiddleware, createCategory);

export default router;
