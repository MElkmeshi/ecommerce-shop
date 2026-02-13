# Quick Start Guide

Get the Telegram Mini App e-commerce shop running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Telegram account
- Terminal/Command prompt

## Steps

### 1. Create Telegram Bot (2 minutes)

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow prompts
3. Copy your bot token (looks like: `123456:ABC-DEF...`)
4. Send `/newapp` to create a Web App
5. Follow prompts to register your Mini App
6. Set temporary URL: `http://localhost:5173`

### 2. Install & Configure (1 minute)

```bash
# Clone and navigate to project
cd ecommerce-shop

# Install all dependencies (root, client, server)
npm install

# Set up server environment
cd server
cp .env.example .env
```

**Edit `server/.env` and paste your bot token:**
```env
BOT_TOKEN=paste-your-bot-token-here
```

### 3. Set Up Database (30 seconds)

```bash
# Still in server directory
npm run db:generate
npm run db:migrate
npm run db:seed
```

This creates sample products and an admin user.

### 4. Start Development Servers (1 minute)

Open **two terminal windows**:

**Terminal 1:**
```bash
cd server
npm run dev
```

**Terminal 2:**
```bash
cd client
npm run dev
```

### 5. Test Locally (30 seconds)

**Option A: Browser (without Telegram)**
- Open http://localhost:5173
- Browse products, add to cart
- Note: Checkout won't work (needs Telegram)

**Option B: With ngrok (full Telegram experience)**

```bash
# Terminal 3
ngrok http 5173
```

1. Copy the HTTPS URL from ngrok
2. Update `WEB_APP_URL` in `server/.env`
3. Restart server
4. Update URL in BotFather (`/myapps` → Edit → Web App URL)
5. Open your bot in Telegram
6. Send `/start`
7. Click "Open Shop" button

## Test Admin Panel

1. Open http://localhost:5173/admin/login
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Create/edit products
4. Changes instantly reflect in Telegram Mini App

## Default Admin Credentials

```
Username: admin
Password: admin123
```

**⚠️ Change these in production!**

## Test Webhook

1. Go to https://webhook.site
2. Copy your unique URL
3. Set `WEBHOOK_URL` in `server/.env`
4. Restart server
5. Place an order in Telegram
6. Check webhook.site for the order payload

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Customize products and categories
- Deploy to production (see README)
- Integrate your own webhook/fulfillment system

## Troubleshooting

**Bot doesn't respond?**
- Check bot token is correct
- Ensure server is running

**Web App won't open?**
- Verify URL in BotFather matches ngrok URL
- Check client is running on port 5173

**Database errors?**
- Delete `sqlite.db` and re-run migrations
- Check you ran `npm run db:migrate` and `npm run db:seed`

## Common Commands

```bash
# Root (run from ecommerce-shop/)
npm install              # Install all dependencies
npm run dev              # Start both client and server

# Server (run from server/)
npm run dev              # Start server with hot reload
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Drizzle Studio (DB viewer)

# Client (run from client/)
npm run dev              # Start client with hot reload
npm run build            # Build for production
```

## Project Structure

```
ecommerce-shop/
├── client/           # React frontend (Telegram Mini App)
├── server/           # Node.js backend (API + Bot)
├── package.json      # Root workspace config
└── README.md         # Full documentation
```

## Support

- **Full Documentation**: [README.md](README.md)
- **Telegram Mini Apps Docs**: https://docs.telegram-mini-apps.com
- **Issues**: Open a GitHub issue

---

🎉 **You're all set!** Start building your Telegram e-commerce empire!
