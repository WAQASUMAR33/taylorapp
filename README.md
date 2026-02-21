# 🪡 TailorFlow - Modern Tailor Management System

A beautiful, modern web application for managing tailor shop operations built with Next.js 16, Tailwind CSS 4, and MySQL.

![TailorFlow](https://img.shields.io/badge/TailorFlow-v1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479a1)

## ✨ Features

### 🎨 Beautiful Modern UI
- Stunning gradient backgrounds and card designs
- Smooth animations and transitions
- Fully responsive design
- Clean, professional light theme
- Premium visual aesthetics

### 🔐 Secure Authentication
- NextAuth.js integration
- Role-based access control (Admin, Manager, Staff)
- Secure password hashing with bcrypt
- Protected routes and API endpoints

### 📊 Dashboard
- Real-time statistics and metrics
- Quick action buttons
- Recent orders overview
- Today's performance summary
- Beautiful gradient stat cards

### 👥 Customer Management
- Customer profiles and contact information
- Measurement tracking
- Order history
- Custom notes and preferences

### ✂️ Stitching Orders
- Order creation and tracking
- Status management (Pending, Processing, Ready, Delivered)
- Delivery date tracking
- Advance payment tracking

### 👔 Employee Management
- Employee profiles
- Role assignment
- Salary management
- Order assignment tracking

### 📦 Inventory & Products
- Product catalog
- Stock management
- Purchase tracking
- Low stock alerts

### 💰 Financial Management
- Revenue tracking
- Ledger entries
- Bill generation
- Payment tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MySQL database running
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd tailorapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/tailordb2"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create admin user**
   ```bash
   node create-admin.js
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 🔑 Default Admin Credentials

**Username:** `theitxprts@gmail.com`  
**Password:** `786ninja`

> ⚠️ **Important:** Change these credentials after first login!

## 📁 Project Structure

```
tailorapp/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Database seeding
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/          # NextAuth API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── login/             # Login page
│   │   ├── layout.js          # Root layout
│   │   └── page.js            # Home page (redirects to login)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   └── Providers.jsx      # Session provider
│   └── lib/
│       ├── prisma.js          # Prisma client
│       └── utils.js           # Utility functions
├── public/                    # Static assets
└── package.json
```

## 🎨 Design System

### Color Palette
- **Primary:** Blue (#3B82F6) to Indigo (#6366F1) gradients
- **Success:** Green (#10B981)
- **Warning:** Orange (#F59E0B)
- **Error:** Red (#EF4444)
- **Info:** Purple (#8B5CF6)

### Typography
- **Font Family:** Geist Sans (default), Geist Mono (code)
- **Headings:** Bold, gradient text
- **Body:** Clean, readable zinc colors

### Components
- **Cards:** White background, subtle shadows, rounded corners
- **Buttons:** Gradient backgrounds, hover effects, active states
- **Icons:** Lucide React icon library
- **Forms:** Clean inputs with focus states

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Authentication:** NextAuth.js 4
- **Database:** MySQL
- **ORM:** Prisma 7
- **Icons:** Lucide React
- **Password Hashing:** bcryptjs
- **Session Management:** JWT

## 📱 Responsive Design

TailorFlow is fully responsive and works seamlessly on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1280px+)

## 🔒 Security Features

- ✅ Secure password hashing with bcrypt
- ✅ JWT-based session management
- ✅ Role-based access control
- ✅ Protected API routes
- ✅ SQL injection prevention with Prisma
- ✅ XSS protection

## 🎯 User Roles

### Admin
- Full system access
- User management
- All CRUD operations
- System settings

### Manager
- Customer management
- Order management
- Employee management
- Inventory management
- Reports viewing

### Staff
- View customers
- Create orders
- View assigned orders
- Basic operations

## 📊 Database Schema

The application uses the following main models:
- **User** - System users with roles
- **Customer** - Customer information
- **Employee** - Employee records
- **Order** - Stitching orders
- **Product** - Inventory items
- **Purchase** - Purchase records
- **Bill** - Billing information
- **Measurement** - Customer measurements
- **LedgerEntry** - Financial transactions
- **StockMovement** - Inventory tracking

## 🚧 Future Enhancements

- [ ] SMS notifications
- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Invoice generation
- [ ] Payment gateway integration
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Export to PDF/Excel
- [ ] Barcode scanning

## 📄 License

This project is private and proprietary.

## 👨‍💻 Developer

Built with ❤️ for modern tailor shops

## 🤝 Support

For support, email theitxprts@gmail.com

---

**TailorFlow** - Making tailor shop management beautiful and efficient! ✂️✨
