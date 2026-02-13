import { Router } from 'express';
import { getProducts, getProductById, getCategories } from '../controllers/products.controller';

const router = Router();

// Public routes (no auth required for browsing)
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/categories', getCategories);

export default router;
