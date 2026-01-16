# 🌱 AgriConnect

> Connecting Farmers directly with Buyers. Fresh produce, fair prices, transparent supply chain.

AgriConnect is a mobile application built to bridge the gap between local farmers and buyers (consumers, restaurants, retailers). By eliminating middlemen, we ensure that farmers get better value for their hard work while buyers receive fresh, high-quality agricultural products.

## ✨ Features

- **For Farmers:**
  - 📋 **Manage Inventory:** Easily list products with details (price, quantity, images).
  - 📦 **Order Management:** Track orders from confirmation to delivery.
  - 📊 **Dashboard:** View earnings and operational metrics.
  - 👤 **Profile:** Showcase farm details and build trust.

- **For Buyers:**
  - 🛒 **Marketplace:** Browse a wide variety of fresh produce.
  - 🔍 **Search & Filter:** Find exactly what you need by category or supplier.
  - 🛍️ **Seamless Ordering:** Easy cart management and checkout process.
  - 🧾 **Order History:** Keep track of past purchases and current order status.

## 🛠️ Tech Stack

This project is built with a modern, performance-oriented stack:

- **Frontend:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 50+)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (TailwindCSS for React Native)
- **Backend / Database:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on your mobile device (iOS/Android) or an Emulator.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/agriconnect.git
   cd agriconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory (copy from `.env.example` if available) and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the application**
   ```bash
   npx expo start
   ```

5. **Run on Device**
   - Scan the QR code with the **Expo Go** app (Android) or Camera app (iOS).
   - Press `a` for Android Emulator or `i` for iOS Simulator.

## 📂 Project Structure

```
agri/
├── app/                 # Main application routes (Expo Router)
│   ├── (app)/           # Protected app routes (tabs, stack)
│   ├── (auth)/          # Authentication routes (login, signup)
│   └── _layout.tsx      # Root layout configuration
├── components/          # Reusable UI components
├── lib/                 # Utilities and Supabase client configuration
├── assets/              # Images, fonts, and other static assets
├── database/            # SQL scripts for database schema and setup
└── types/               # TypeScript type definitions
```

## 🗄️ Database

The project uses **Supabase** (PostgreSQL). Key tables include:
- `profiles`: User information (Buyers & Farmers).
- `products`: Agricultural items listed by farmers.
- `orders`: Transaction records.
- `order_items`: Specific items within an order.

Schema initialization scripts can be found in the root or `database/` folder (e.g., `supabase_schema.sql`).

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

