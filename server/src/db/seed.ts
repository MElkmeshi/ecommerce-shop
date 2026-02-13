import { db } from './index';
import { categories, products, admins } from './schema';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('Clearing existing data...');
    await db.delete(products);
    await db.delete(categories);
    await db.delete(admins);

    // Seed categories
    console.log('Seeding categories...');
    const categoryData = [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Books', slug: 'books' },
      { name: 'Home & Garden', slug: 'home-garden' },
      { name: 'Sports', slug: 'sports' },
    ];

    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    console.log(`✅ Created ${insertedCategories.length} categories`);

    // Seed products
    console.log('Seeding products...');
    const productData = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality Bluetooth headphones with noise cancellation',
        price: 89.99,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        stock: 50,
        categoryId: insertedCategories[0].id,
      },
      {
        name: 'Smartphone',
        description: 'Latest model with advanced features and long battery life',
        price: 699.99,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        stock: 30,
        categoryId: insertedCategories[0].id,
      },
      {
        name: 'Laptop',
        description: 'Powerful laptop for work and entertainment',
        price: 1299.99,
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        stock: 20,
        categoryId: insertedCategories[0].id,
      },
      {
        name: 'T-Shirt',
        description: 'Comfortable cotton t-shirt in various colors',
        price: 19.99,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        stock: 100,
        categoryId: insertedCategories[1].id,
      },
      {
        name: 'Jeans',
        description: 'Classic denim jeans with perfect fit',
        price: 49.99,
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        stock: 75,
        categoryId: insertedCategories[1].id,
      },
      {
        name: 'The Great Gatsby',
        description: 'Classic American novel by F. Scott Fitzgerald',
        price: 12.99,
        imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500',
        stock: 200,
        categoryId: insertedCategories[2].id,
      },
      {
        name: 'JavaScript Guide',
        description: 'Complete guide to modern JavaScript development',
        price: 39.99,
        imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
        stock: 150,
        categoryId: insertedCategories[2].id,
      },
      {
        name: 'Garden Tools Set',
        description: 'Complete set of essential gardening tools',
        price: 79.99,
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
        stock: 40,
        categoryId: insertedCategories[3].id,
      },
      {
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat for home workouts',
        price: 29.99,
        imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
        stock: 80,
        categoryId: insertedCategories[4].id,
      },
      {
        name: 'Running Shoes',
        description: 'Lightweight running shoes with great support',
        price: 89.99,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        stock: 60,
        categoryId: insertedCategories[4].id,
      },
    ];

    const insertedProducts = await db.insert(products).values(productData).returning();
    console.log(`✅ Created ${insertedProducts.length} products`);

    // Seed admin user
    console.log('Seeding admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);

    await db.insert(admins).values({
      username: 'admin',
      passwordHash,
    });
    console.log('✅ Created admin user (username: admin, password: admin123)');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - ${insertedCategories.length} categories`);
    console.log(`   - ${insertedProducts.length} products`);
    console.log(`   - 1 admin user`);
    console.log('\n🔐 Admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
