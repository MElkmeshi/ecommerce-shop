import { Request, Response } from 'express';
import { db } from '../db';
import { orders, orderItems, products, users } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { sendOrderNotification } from '../services/webhook.service';

// Validation schemas
export const createOrderSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  location: z.union([
    z.object({
      latitude: z.number(),
      longitude: z.number(),
      altitude: z.number().optional(),
      speed: z.number().optional(),
      accuracy: z.number().optional(),
    }),
    z.object({
      address: z.string().min(1),
    }),
  ]),
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
      })
    )
    .min(1, 'At least one item is required'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Create new order
 * POST /api/orders
 */
export async function createOrder(req: Request, res: Response) {
  try {
    // Get Telegram user from middleware
    const telegramUser = (req as any).telegramUser;

    if (!telegramUser) {
      return res.status(401).json({ error: 'Telegram authentication required' });
    }

    // Validate request body
    const orderData = createOrderSchema.parse(req.body);

    // Find or create user in database
    let user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramUser.id))
      .limit(1);

    if (user.length === 0) {
      // Create user if not exists
      const newUser = await db
        .insert(users)
        .values({
          telegramId: telegramUser.id,
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null,
          username: telegramUser.username || null,
          languageCode: telegramUser.language_code || null,
        })
        .returning();
      user = newUser;
    }

    const userId = user[0].id;

    // Fetch product details and validate availability
    const productIds = orderData.items.map((item) => item.productId);
    const productDetails = await db
      .select()
      .from(products)
      .where(
        sql`${products.id} IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`
      );

    // Validate all products exist
    if (productDetails.length !== productIds.length) {
      return res.status(400).json({ error: 'Some products not found' });
    }

    // Create product map for quick lookup
    const productMap = new Map(productDetails.map((p) => [p.id, p]));

    // Validate stock and calculate total
    let totalAmount = 0;
    const itemsWithDetails = [];

    for (const item of orderData.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      itemsWithDetails.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create order
    const newOrder = await db
      .insert(orders)
      .values({
        userId,
        phoneNumber: orderData.phoneNumber,
        location: JSON.stringify(orderData.location),
        totalAmount,
        status: 'pending',
      })
      .returning();

    const orderId = newOrder[0].id;

    // Create order items
    await db.insert(orderItems).values(
      itemsWithDetails.map((item) => ({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }))
    );

    // Update product stock
    for (const item of orderData.items) {
      const product = productMap.get(item.productId)!;
      await db
        .update(products)
        .set({ stock: product.stock - item.quantity })
        .where(eq(products.id, item.productId));
    }

    // Send webhook notification (non-blocking)
    const location = orderData.location;
    sendOrderNotification({
      orderId,
      phoneNumber: orderData.phoneNumber,
      location: 'latitude' in location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : {
            address: location.address,
          },
      totalAmount,
      items: itemsWithDetails,
      telegramUser: {
        id: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        languageCode: telegramUser.language_code,
      },
      timestamp: new Date().toISOString(),
    }).catch((err) => {
      console.error('Webhook notification failed:', err);
    });

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        totalAmount,
        status: 'pending',
        createdAt: newOrder[0].createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid order data', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to create order' });
  }
}

/**
 * Get user's orders
 * GET /api/orders
 */
export async function getUserOrders(req: Request, res: Response) {
  try {
    const telegramUser = (req as any).telegramUser;

    if (!telegramUser) {
      return res.status(401).json({ error: 'Telegram authentication required' });
    }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramUser.id))
      .limit(1);

    if (user.length === 0) {
      return res.json({ orders: [] });
    }

    // Fetch user's orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user[0].id))
      .orderBy(desc(orders.createdAt));

    res.json({ orders: userOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}
