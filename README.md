# RestaurantOS & Self-Order Kiosk

A unified restaurant management and self-ordering kiosk system built with React, Vite, Tailwind CSS, and Supabase.

## Features

- **RestaurantOS (Management & POS)**
  - Live Kitchen Display System (KDS) with real-time order updates
  - Cashier point-of-sale (POS) and payment confirmation
  - Menu and product customization management
  - Shift and cash balance tracking
  - Role-based access control (Admin, Manager, Cashier, Kitchen, Kiosk)
  - PDF receipt generation and data export

- **Self-Order Kiosk**
  - Touchscreen-friendly ordering interface
  - Dynamic item customization engine (sauces, toppings, removals)
  - Multi-language support (English, Turkish, Polish, Ukrainian)
  - Dine-in and Takeaway ordering modes
  - Multiple payment options (Pay at Cashier, Card, BLIK, Kiosk POS)

- **Backend & Database**
  - Supabase PostgreSQL with Row Level Security (RLS)
  - Real-time order sync using Supabase Realtime
  - Automated daily sequential order numbering (#101, #102...)

## Project Structure

- OS/ - Admin dashboard, cashier POS, and kitchen display web application
- Self_Order_Kiosk/ - Customer-facing self-ordering kiosk application
- supabase/ - Database migrations and Edge Functions
- supabase_schema.sql - Complete database schema

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm
- Supabase account and project

### 1. Database Setup

Run the SQL queries in supabase_schema.sql inside your Supabase SQL Editor.

### 2. Environment Configuration

Create a .env file in both OS/ and Self_Order_Kiosk/ based on .env.example:

`env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
`

### 3. Installation & Running

#### RestaurantOS (Admin & POS):
`ash
cd OS
npm install
npm run dev
`

#### Self-Order Kiosk:
`ash
cd Self_Order_Kiosk
npm install
npm run dev
`

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React
- **Backend / Database:** Supabase (PostgreSQL, Realtime, Auth, Edge Functions)
- **Utilities:** jsPDF, jsPDF-AutoTable

## License

MIT
