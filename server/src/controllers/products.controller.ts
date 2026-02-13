import { Request, Response } from 'express';
import { db } from '../db';
import { products, categories } from '../db/schema';
import { eq, like, and, between, asc, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
export const getProductsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  sort: z.enum(['name', 'price-asc', 'price-desc', 'newest']).optional().default('newest'),
});

/**
 * Get all products with filters
 * GET /api/products
 */
export async function getProducts(req: Request, res: Response) {
  try {
    const query = getProductsQuerySchema.parse(req.query);

    // Build query conditions
    const conditions = [];

    // Search by name or description
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(
        sql`(${products.name} LIKE ${searchPattern} OR ${products.description} LIKE ${searchPattern})`
      );
    }

    // Filter by category slug
    if (query.category) {
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, query.category))
        .limit(1);

      if (category.length > 0) {
        conditions.push(eq(products.categoryId, category[0].id));
      } else {
        // Invalid category, return empty results
        return res.json({ products: [], total: 0 });
      }
    }

    // Filter by price range
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const min = query.minPrice ?? 0;
      const max = query.maxPrice ?? Number.MAX_VALUE;
      conditions.push(between(products.price, min, max));
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    let orderBy;
    switch (query.sort) {
      case 'name':
        orderBy = asc(products.name);
        break;
      case 'price-asc':
        orderBy = asc(products.price);
        break;
      case 'price-desc':
        orderBy = desc(products.price);
        break;
      case 'newest':
      default:
        orderBy = desc(products.createdAt);
        break;
    }

    // Fetch products with category info
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
        categorySlug: categories.slug,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderBy);

    res.json({
      products: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

/**
 * Get product by ID
 * GET /api/products/:id
 */
export async function getProductById(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

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
        categorySlug: categories.slug,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, productId))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

/**
 * Get all categories
 * GET /api/categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const result = await db.select().from(categories).orderBy(asc(categories.name));

    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}
