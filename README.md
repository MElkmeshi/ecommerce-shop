# Telegram Mini App E-Commerce Shop

A full-stack e-commerce application built as a Telegram Mini App using React, TypeScript, Node.js, and SQLite. Features include product browsing with advanced filters, shopping cart, Telegram geolocation integration, and a complete admin panel.

## Features

### User Features (Telegram Mini App)
- 🛍️ **Product Browsing** - Grid view with images, prices, and stock status
- 🔍 **Advanced Filtering** - Search, category filter, price range, sorting
- 🛒 **Shopping Cart** - Add/remove items, adjust quantities, persistent storage
- 📍 **Telegram Geolocation** - Native location sharing for delivery
- 📱 **Native Phone Number** - Telegram contact sharing
- 🎨 **Telegram Theme** - Auto-adapts to user's Telegram theme (light/dark)
- ✅ **Order Placement** - Secure checkout with Telegram authentication

### Admin Features (Web Dashboard)
- 🔐 **Secure Login** - JWT-based authentication
- 📦 **Product Management** - Create, read, update, delete products
- 📊 **Order Management** - View all orders with customer details
- 🏷️ **Category Management** - Organize products by category
- 📈 **Real-time Updates** - Instant reflection of changes

### Backend Features
- 🤖 **Telegram Bot** - `/start`, `/shop`, `/help` commands
- 🔒 **Telegram Auth** - HMAC-SHA256 signature verification
- 🪝 **Webhook Integration** - Send order notifications to external URLs
- 💾 **SQLite Database** - Zero-config, portable database
- 🔄 **Type-safe ORM** - Drizzle ORM with auto-generated types

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **@tma.js/sdk-react** - Official Telegram Mini Apps SDK
- **React Router** - Client-side routing
- **Zustand** - State management with persistence
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible UI components
- **React Hook Form + Zod** - Form validation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **TypeScript** - Type safety
- **Express** - Web framework
- **Telegraf** - Telegram bot framework
- **Drizzle ORM** - Type-safe SQL ORM
- **better-sqlite3** - SQLite driver
- **Zod** - Schema validation
- **JWT** - Admin authentication
- **bcrypt** - Password hashing

## Project Structure

```
ecommerce-shop/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CartItem.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── FilterPanel.tsx
│   │   ├── pages/            # Route pages
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   └── admin/
│   │   ├── lib/              # Utilities
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── store/            # Zustand stores
│   │   │   └── cartStore.ts
│   │   ├── types/            # TypeScript types
│   │   ├── init.ts           # Telegram SDK init
│   │   ├── mockEnv.ts        # Dev mocking
│   │   └── index.tsx         # Entry point
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── bot/              # Telegram bot
│   │   │   └── index.ts
│   │   ├── db/               # Database
│   │   │   ├── schema.ts
│   │   │   ├── index.ts
│   │   │   ├── migrate.ts
│   │   │   └── seed.ts
│   │   ├── routes/           # API routes
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth & validation
│   │   ├── services/         # Business logic
│   │   │   └── webhook.service.ts
│   │   └── index.ts          # Server entry
│   └── package.json
│
└── package.json              # Root workspace config
```

## Prerequisites

- **Node.js** 18+ and npm
- **Telegram account** to create a bot
- **ngrok** or similar (for local development)

## Setup Instructions

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions to create your bot
3. Save the **bot token** (e.g., `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. Send `/newapp` to create a Web App
5. Follow prompts to register your Mini App
6. Set the Web App URL (you'll update this after deployment)

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Return to root
cd ..
```

### 3. Configure Environment Variables

#### Server (.env)

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=3000
DATABASE_URL=sqlite.db

# Paste your bot token from BotFather
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# For local dev, use ngrok URL; for production, use your domain
WEB_APP_URL=http://localhost:5173

# Generate a strong secret (or use: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Get a test webhook URL from https://webhook.site
WEBHOOK_URL=https://webhook.site/your-unique-url

CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

#### Client (.env)

```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_DEV_MODE=true
```

### 4. Set Up Database

```bash
cd ../server

# Generate Drizzle migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

This creates:
- 5 categories (Electronics, Clothing, Books, Home & Garden, Sports)
- 10 sample products
- 1 admin user (username: `admin`, password: `admin123`)

### 5. Start Development Servers

Open two terminal windows:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

The server runs on `http://localhost:3000` and client on `http://localhost:5173`.

### 6. Expose Local Server with ngrok

To test the Telegram Mini App locally, you need to expose your frontend to the internet:

```bash
ngrok http 5173
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and:

1. Update `WEB_APP_URL` in `server/.env`
2. Set this URL in BotFather:
   - Send `/myapps` to BotFather
   - Select your app
   - Edit → Web App URL
   - Paste the ngrok URL

### 7. Test in Telegram

1. Open Telegram and find your bot
2. Send `/start`
3. Click "Open Shop" button
4. The Mini App should open with the products page

## Usage

### User Flow (Telegram Mini App)

1. **Browse Products**
   - Search by name/description
   - Filter by category
   - Filter by price range
   - Sort by name/price/date

2. **Add to Cart**
   - Click "Add to Cart" on any product
   - View cart badge updating in real-time
   - Cart persists across sessions (localStorage)

3. **Checkout**
   - Enter phone number
   - Click "Share Location" to use Telegram geolocation
   - Or enter address manually
   - Review order summary
   - Place order

4. **Order Confirmation**
   - Success message displayed
   - Cart cleared
   - Webhook notification sent (check webhook.site)

### Admin Panel

1. **Login**
   - Navigate to `http://localhost:5173/admin/login`
   - Use credentials: `admin` / `admin123`

2. **Manage Products**
   - View all products in table
   - Create new products with images
   - Edit existing products
   - Delete products
   - Products instantly appear in Telegram Mini App

3. **View Orders**
   - See all orders with customer Telegram info
   - View order items and totals
   - Check delivery locations

## Bot Commands

- `/start` - Welcome message with "Open Shop" button
- `/shop` - Direct link to open the Web App
- `/help` - Instructions and command list

## API Endpoints

### Public Endpoints

```
GET  /api/products          # List products (with filters)
GET  /api/products/:id      # Get product by ID
GET  /api/categories        # List categories
POST /api/orders            # Create order (Telegram auth required)
GET  /api/orders            # Get user orders (Telegram auth required)
```

### Admin Endpoints

```
POST   /api/admin/login              # Admin login (JWT)
GET    /api/admin/products           # List all products
POST   /api/admin/products           # Create product
PUT    /api/admin/products/:id       # Update product
DELETE /api/admin/products/:id       # Delete product
GET    /api/admin/orders             # List all orders
POST   /api/admin/categories         # Create category
```

## Telegram Authentication

The app uses Telegram's Web App `initData` for authentication:

1. Frontend sends `initData.raw()` in `X-Telegram-Init-Data` header
2. Backend verifies HMAC-SHA256 signature using bot token
3. User info extracted from verified initData

No JWT needed for users - Telegram handles authentication!

## Webhook Payload

When an order is placed, this payload is sent to `WEBHOOK_URL`:

```json
{
  "orderId": 123,
  "phoneNumber": "+1234567890",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "totalAmount": 99.99,
  "items": [
    {
      "productName": "Wireless Headphones",
      "quantity": 2,
      "price": 49.99
    }
  ],
  "telegramUser": {
    "id": 123456789,
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "languageCode": "en"
  },
  "timestamp": "2026-02-13T10:30:00Z"
}
```

## Deployment

### Frontend (Vercel/Netlify)

```bash
cd client
npm run build
# Deploy dist/ folder
```

Set environment variable:
```
VITE_API_URL=https://your-api-domain.com/api
```

### Backend (Railway/Render/Fly.io)

```bash
cd server
npm run build
# Deploy with start command: npm start
```

Set all environment variables from `.env.example`.

### Database

For production, consider migrating to PostgreSQL:

```bash
npm install drizzle-orm pg
# Update drizzle.config.ts to use 'pg' driver
# Update connection in db/index.ts
```

## Testing Checklist

### Telegram Bot
- [ ] `/start` command shows welcome message
- [ ] "Open Shop" button launches Web App
- [ ] Web App opens in Telegram with correct theme
- [ ] User info (name, username) displays correctly

### Shopping Flow
- [ ] Products load and display correctly
- [ ] Search filters products by name
- [ ] Category filter works
- [ ] Price range filter works
- [ ] Sorting changes order
- [ ] Add to cart updates badge
- [ ] Cart persists on page refresh
- [ ] Quantity updates work
- [ ] Remove from cart works

### Checkout
- [ ] Phone number validation works
- [ ] Location sharing requests permission
- [ ] Location data captured correctly
- [ ] Manual address input fallback works
- [ ] Order submission succeeds
- [ ] Cart clears after order
- [ ] Webhook receives order data
- [ ] Telegram user info in webhook payload

### Admin Panel
- [ ] Login with admin credentials
- [ ] Product table displays all products
- [ ] Create new product works
- [ ] Edit product updates correctly
- [ ] Delete product removes from list
- [ ] Changes reflect in Telegram Mini App
- [ ] Orders page shows all orders
- [ ] Logout redirects to login

## Troubleshooting

### Bot doesn't respond
- Check `BOT_TOKEN` is correct in `.env`
- Ensure server is running
- Check server logs for errors

### Web App doesn't open
- Verify `WEB_APP_URL` matches your ngrok/deployed URL
- Check URL is set in BotFather
- Ensure client is built and accessible

### Location sharing doesn't work
- Location requires HTTPS (ngrok provides this)
- Check browser/Telegram permissions
- Fallback to manual address should work

### Webhook not receiving data
- Verify `WEBHOOK_URL` is correct
- Check webhook.site for requests
- Webhook failures don't block order creation

### Database errors
- Ensure migrations ran: `npm run db:migrate`
- Check `sqlite.db` file exists in server directory
- Try re-running seed: `npm run db:seed`

## Development Tips

### Hot Reload
Both client and server support hot reload during development.

### Database Studio
View/edit database with Drizzle Studio:
```bash
cd server
npm run db:studio
# Opens at http://localhost:4983
```

### Mock Data
The dev environment mocks a Telegram user for local testing without Telegram.

### Debugging
- Client errors: Check browser console
- Server errors: Check terminal running server
- Network: Check browser Network tab for API calls

## Future Enhancements

- [ ] Product images upload (S3/Cloudinary)
- [ ] Order status tracking
- [ ] Email notifications
- [ ] Pagination for products
- [ ] Product variants (size, color)
- [ ] Inventory management
- [ ] Analytics dashboard
- [ ] Multi-currency support
- [ ] Payment gateway integration (Stripe/Telegram Stars)
- [ ] Customer accounts with order history

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For issues or questions:
- Check troubleshooting section
- Review [Telegram Mini Apps docs](https://docs.telegram-mini-apps.com)
- Open a GitHub issue

---

Built with ❤️ using [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
