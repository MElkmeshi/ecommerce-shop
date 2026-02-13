import { Telegraf, Context } from 'telegraf';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:5173';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is required');
}

export const bot = new Telegraf(BOT_TOKEN);

/**
 * Upsert Telegram user to database
 */
async function upsertTelegramUser(telegramUser: any) {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramUser.id))
      .limit(1);

    if (existingUser.length === 0) {
      // Create new user
      await db.insert(users).values({
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
        languageCode: telegramUser.language_code || null,
      });
      console.log(`✅ Created new user: ${telegramUser.id} (${telegramUser.first_name})`);
    } else {
      // Update existing user
      await db
        .update(users)
        .set({
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null,
          username: telegramUser.username || null,
          languageCode: telegramUser.language_code || null,
        })
        .where(eq(users.telegramId, telegramUser.id));
      console.log(`✅ Updated user: ${telegramUser.id} (${telegramUser.first_name})`);
    }
  } catch (error) {
    console.error('❌ Failed to upsert user:', error);
  }
}

// /start command
bot.command('start', async (ctx: Context) => {
  if (!ctx.from) return;

  // Upsert user to database
  await upsertTelegramUser(ctx.from);

  const firstName = ctx.from.first_name || 'there';

  await ctx.reply(
    `👋 Welcome to our shop, ${firstName}!\n\n` +
      `Browse our products, add items to your cart, and place orders easily.\n\n` +
      `Click the button below to start shopping! 🛍️`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🛒 Open Shop',
              web_app: { url: WEB_APP_URL },
            },
          ],
        ],
      },
    }
  );
});

// /shop command
bot.command('shop', async (ctx: Context) => {
  if (!ctx.from) return;

  // Upsert user to database
  await upsertTelegramUser(ctx.from);

  await ctx.reply('Opening shop... 🛍️', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🛒 Browse Products',
            web_app: { url: WEB_APP_URL },
          },
        ],
      ],
    },
  });
});

// /help command
bot.command('help', async (ctx: Context) => {
  await ctx.reply(
    `📱 *How to use the shop:*\n\n` +
      `1️⃣ Click "Open Shop" to browse products\n` +
      `2️⃣ Add items to your cart\n` +
      `3️⃣ Go to checkout and complete your order\n` +
      `4️⃣ Share your location and phone number for delivery\n\n` +
      `*Commands:*\n` +
      `/start - Start shopping\n` +
      `/shop - Open the shop\n` +
      `/help - Show this help message\n\n` +
      `Need assistance? Contact support!`,
    { parse_mode: 'Markdown' }
  );
});

// Handle unknown commands
bot.on('text', async (ctx: Context) => {
  if (ctx.message && 'text' in ctx.message && ctx.message.text.startsWith('/')) {
    await ctx.reply(
      `❓ Unknown command. Use /help to see available commands.`
    );
  }
});

// Error handling
bot.catch((err: any, ctx: Context) => {
  console.error('❌ Bot error:', err);
  console.error('Context:', ctx.update);
});

console.log('🤖 Telegram bot initialized');
