# Amy's FreshBites 🍽️

A full-stack, modern online ordering and restaurant management platform built with Next.js App Router, Tailwind CSS, TypeScript, and Supabase.

---

## ✨ Features

### 🛍️ Customer Experience
- **Dynamic Menu Browsing**: Filter dishes by category, view dish details, pricing in Ghana Cedis (`GH₵`), and real-time availability.
- **Cart & Slide-over Drawer**: Add dishes with custom quantities and modify orders on the fly.
- **Customer Wishlist**: Save favorite meals with one click.
- **Online Ordering & Pickup**: Instant checkout flow with special customer instructions and real-time order tracking.
- **Interactive Locations**: Showcase restaurant branches with Google Maps integration.

### 📊 Owner & Admin Dashboard
- **Real-Time Overview**: Live revenue calculations, active prep counters, and latest inbound orders.
- **Interactive DataTables**: Built-in pagination, search filters, category sorting, and instant visibility toggles.
- **Products & Dishes Management**: Create, edit, preview images, and hide/show menu items.
- **Categories Manager**: Organize menu classifications and custom sort orders.
- **Order Fulfillment**: Track kitchen progress from `pending` ➔ `preparing` ➔ `ready` ➔ `completed`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React Server & Client Components)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) primitives
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- A Supabase project

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup
Run the SQL migration in `supabase/migrations/20261005124321_restaurant_schema.sql` inside your Supabase SQL Editor.

### 4. Install & Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License
MIT License. Built for Amy's FreshBites.
