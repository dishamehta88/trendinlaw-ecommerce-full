# 🖤 TREND IN LAW — Style. Vibe. Reflect.

> A premium full-stack e-commerce platform for a modern clothing brand. Built with a sleek, dark aesthetic and a complete shopping experience — from product discovery to checkout.

---

## 🌐 Live Demo

**[→ View Live Website](https://BuildsByAliyan.github.io/trendinlaw-ecommerce/)**

---

## ✨ Features

- 🔐 **User Authentication** — Register, login, and logout with JWT-based sessions
- 🛍️ **Dynamic Product Catalog** — Products loaded from a REST API with category filters and live search
- 🛒 **Shopping Cart** — Persistent cart with quantity controls, item removal, and subtotal calculation
- 💚 **Wishlist** — Save favourite items across sessions via localStorage
- 📦 **Order Placement** — Full checkout flow with customer details and shipping address
- 🔄 **Returns & Exchanges** — Dedicated form connected to a backend API
- 📍 **Order Tracking** — Track order status by Order ID
- 📬 **Contact Form** — Backend-connected contact and enquiry submission
- 📱 **Fully Responsive** — Optimised for desktop, tablet, and mobile
- 🎞️ **Animated Banner Slideshow** — Auto-rotating hero images on the shop page
- 💬 **WhatsApp Integration** — Direct customer-to-brand messaging button
- 🔔 **Toast Notifications** — Non-intrusive cart and action feedback
- ♾️ **Ticker Marquee** — Animated promotional announcement strip

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES2020+) |
| Backend | Node.js, Express.js |
| Auth | JWT (JSON Web Tokens) |
| Data | JSON-based store (MongoDB-ready) |
| Fonts | Google Fonts — Bebas Neue, Barlow Condensed |
| Icons | Font Awesome 6 |
| Version Control | Git & GitHub |

---

## 📁 Project Structure

```
trendinlaw-ecommerce/
├── package.json             # Single set of dependencies (run npm install here)
├── server/
│   ├── server.js            # Express entry point (also serves /docs)
│   ├── .env.example         # Copy to .env and set JWT_SECRET
│   └── .env                 # Your secrets - git-ignored, never commit
├── routes/                  # API route definitions
├── controllers/             # Business logic
├── utils/                   # authHelper, fileHelper, pricing, rateLimit
├── scripts/create-admin.js  # Create an admin account
├── data/                    # JSON "database" files
└── docs/                    # Frontend (HTML, api.js, images)
    ├── index.html, shop.html, product.html, order.html, track.html,
    ├── return-exchange.html, contact.html, wishlist.html, ...
    ├── api.js               # Frontend API client
    ├── image/               # Brand & hero images
    └── product/             # Product images
```

---

## 🖥️ How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher

### Steps

```bash
# 1. Clone and enter the project
git clone https://github.com/CodeWithAliyan/trendinlaw-ecommerce.git
cd trendinlaw-ecommerce

# 2. Install dependencies (from the project root)
npm install

# 3. Configure environment
cp server/.env.example server/.env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"   # paste into JWT_SECRET

# 4. (Optional) create an admin account
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-strong-one' npm run create-admin

# 5. Start the server
npm start
```

Open **http://localhost:5000** - the Express server serves both the API (`/api`) and the website.

> The frontend `docs/api.js` uses `/api` on the same origin automatically. To host the frontend elsewhere (e.g. GitHub Pages), set `window.TIL_API_BASE = 'https://your-api.example.com/api'` before loading `api.js`, and set `CORS_ORIGINS` in `server/.env`.

> **Security notes:** order totals are calculated on the server from the product catalogue; the JSON-file storage is meant for demos / small shops - move to a real database before taking real payments.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `POST` | `/api/auth/logout` | Logout current session |
| `GET` | `/api/auth/me` | Get logged-in user profile |
| `GET` | `/api/products` | Fetch all products (supports `?category=` & `?search=`) |
| `GET` | `/api/products/:id` | Fetch a single product |
| `POST` `PUT` `DELETE` | `/api/products[/:id]` | Manage products (admin only) |
| `POST` | `/api/orders` | Place a new order (auth required; total computed server-side) |
| `GET` | `/api/orders` | Get order history (auth required) |
| `GET` | `/api/orders/track/:id` | Track an order publicly |
| `POST` | `/api/contact` | Submit a contact message |
| `GET` | `/api/contact` | List messages (admin only) |
| `POST` | `/api/returns` | Submit a return/exchange (needs matching Order ID + email) |
| `GET` | `/api/returns` | List return requests (admin only) |
| `GET/POST/PUT/DELETE` | `/api/cart/...` | Server-side cart (auth required) |
| `GET` | `/api/health` | Health check |

---

## 👤 Author

**Aliyan Qureshi**
- GitHub: [@CodeWithAliyan](https://github.com/CodeWithAliyan)

---

## 📄 License

This project is open source and available under the MIT License.
