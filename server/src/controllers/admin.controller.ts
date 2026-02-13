import { Request, Response } from 'express';
import { db } from '../db';
import { admins, products, categories, orders, orderItems, users } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { generateAdminToken } from '../middleware/adminAuth';

// Validation schemas
export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  categoryId: z.number().int().positive('Category ID is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
});

/**
 * Admin login
 * POST /api/admin/login
 */
export async function adminLogin(req: Request, res: Response) {
  try {
    const credentials = adminLoginSchema.parse(req.body);

    // Find admin by username
    const admin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, credentials.username))
      .limit(1);

    if (admin.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, admin[0].passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateAdminToken({
      id: admin[0].id,
      username: admin[0].username,
    });

    res.json({
      token,
      admin: {
        id: admin[0].id,
        username: admin[0].username,
      },
    });
  } catch (error) {
    console.error('Error during admin login:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid credentials', details: error.errors });
    }

    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Get all products (admin view)
 * GET /api/admin/products
 */
export async function getAdminProducts(req: Request, res: Response) {
  try {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        stock: products.stock,
        categoryId: products.categoryId,
        categoryName: categories.name,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    res.json(result);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

/**
 * Create new product
 * POST /api/admin/products
 */
export async function createProduct(req: Request, res: Response) {
  try {
    const productData = createProductSchema.parse(req.body);

    // Verify category exists
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, productData.categoryId))
      .limit(1);

    if (category.length === 0) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const newProduct = await db
      .insert(products)
      .values({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid product data', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to create product' });
  }
}

/**
 * Update product
 * PUT /api/admin/products/:id
 */
export async function updateProduct(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const productData = updateProductSchema.parse(req.body);

    // Verify product exists
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If categoryId is being updated, verify it exists
    if (productData.categoryId) {
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.id, productData.categoryId))
        .limit(1);

      if (category.length === 0) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    const updated = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid product data', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to update product' });
  }
}

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
export async function deleteProduct(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Verify product exists
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.delete(products).where(eq(products.id, productId));

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

/**
 * Get all orders (admin view)
 * GET /api/admin/orders
 */
export async function getAdminOrders(req: Request, res: Response) {
  try {
    // Fetch all orders with user info
    const allOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        phoneNumber: orders.phoneNumber,
        location: orders.location,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userUsername: users.username,
        userTelegramId: users.telegramId,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    // Fetch order items for all orders
    const orderIds = allOrders.map((o) => o.id);

    if (orderIds.length === 0) {
      return res.json([]);
    }

    const items = await db
      .select({
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: products.name,
        quantity: orderItems.quantity,
        price: orderItems.price,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(
        sql`${orderItems.orderId} IN (${sql.join(orderIds.map((id) => sql`${id}`), sql`, `)})`
      );

    // Group items by order
    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.orderId]) {
        acc[item.orderId] = [];
      }
      acc[item.orderId].push(item);
      return acc;
    }, {} as Record<number, typeof items>);

    // Combine orders with items
    const result = allOrders.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

/**
 * Create new category
 * POST /api/admin/categories
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const categoryData = createCategorySchema.parse(req.body);

    // Check if slug already exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categoryData.slug))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Category slug already exists' });
    }

    const newCategory = await db.insert(categories).values(categoryData).returning();

    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid category data', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to create category' });
  }
}
