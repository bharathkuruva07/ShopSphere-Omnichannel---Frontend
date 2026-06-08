# Shop Sphere - Modern E-Commerce Platform

A complete omnichannel e-commerce application with customer portal and admin dashboard built with React, Vite, Bootstrap, and JSON Server.

## ⚡ Ultra-Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start everything (Recommended)
npm run dev:full

# This starts:
# - JSON Server (backend mock) on http://localhost:3001
# - React app (frontend) on http://localhost:5173
```

## 🎯 Quick Links

### Admin Portal
- **URL**: http://localhost:5173/admin
- **Email**: admin@shop.com
- **Password**: admin123
- **Access**: Dashboard, Orders, Products Management

### Customer Portal
- **URL**: http://localhost:5173
- **Test Accounts**:
  - john@example.com / john@123
  - sarah@example.com / sarah@456
  - mike@example.com / mike@789
- **Or**: Create your own account at `/signup`

## 🔐 Authentication System

### ✨ Features
✅ Real customer authentication (validates against database)  
✅ Proper signup/registration with validation  
✅ Duplicate email detection  
✅ Password strength requirements (6+ chars with number/special char)  
✅ Auto-login after signup  
✅ Session persistence with localStorage  
✅ Role-based access (admin vs customer)  

### Test the System
1. Go to `/login` - login with test accounts
2. Go to `/signup` - create your own account
3. Try invalid credentials - see error handling
4. Logout and verify session clears

**Learn More**: See `AUTHENTICATION_GUIDE.md`

## 📋 Features

### 👥 Customer Features
✅ Secure authentication & registration  
✅ Product search, filter, and sorting  
✅ Shopping cart management  
✅ Secure checkout process  
✅ Order tracking with real-time updates  
✅ User profile with order history  
✅ Loyalty points system (1 point per $10)  
✅ Responsive mobile design  

### 👨‍💼 Admin Features
✅ Analytics dashboard with charts  
✅ Revenue trends (7-day view)  
✅ Inventory CRUD operations  
✅ Real-time stock management  
✅ Order fulfillment system  
✅ Manual tracking status updates  
✅ Order status management  

## 🛠️ Tech Stack

- **React 19.2** - UI library
- **Vite** - Build tool and dev server
- **Bootstrap 5.3** - CSS framework
- **Axios** - HTTP client
- **JSON Server** - Mock API backend
- **Material UI** - Component library
- **Recharts** - Charts and analytics
- **React Router v6** - Navigation
- **Lucide React** - Icons
- **React Context** - State management

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
│   ├── Auth/         # Login, Signup pages
│   ├── Admin/        # Admin dashboard, inventory, orders
│   └── ...           # Customer pages
├── context/          # Global state (AppContext)
├── data/             # Dummy product data
└── App.jsx           # Main app with routing
```

## 🚀 Usage

### For Customers
1. Sign up or login
2. Browse products, use search and filters
3. Add items to cart
4. Proceed to checkout
5. View orders and loyalty points in profile

### For Admin
1. Login with `admin@shop.com` / `admin123`
2. Access admin panel
3. View analytics on dashboard
4. Manage products in inventory
5. Update order status and tracking

## 📊 Dummy Data

- **8 Products** pre-loaded with images, prices, ratings
- **Product Categories**: Electronics, Accessories
- **Mock Orders** created on checkout
- **Loyalty Points** auto-calculated

## 💾 Data Persistence

User data is saved to browser localStorage:
- Authentication state
- Shopping cart
- Orders
- Loyalty points

## 🎨 Responsive Design

- Mobile-first approach
- Fully responsive on all devices
- Touch-friendly mobile navigation
- Professional design with gradients

## 📖 Detailed Documentation

See [FEATURES.md](./FEATURES.md) for comprehensive documentation including:
- Complete feature list
- Installation guide
- Customization options
- Troubleshooting
- Deployment guide

## 🔒 Authentication

- Simple demo authentication (any email/password for customer)
- Admin credentials: `admin@shop.com` / `admin123`
- User roles: customer, admin

## 📱 Mobile Optimized

- Responsive Bootstrap layout
- Mobile menu navigation
- Touch-friendly buttons
- Optimized images

## 🎁 Loyalty Program

- Earn 1 point per $10 spent
- 100 points = $10 discount
- Points displayed in user profile
- Auto-calculated on purchase

## 🔄 State Management

Global state using React Context:
```javascript
const { 
  currentUser,      // Current logged-in user
  products,         // All products
  cart,             // Shopping cart items
  orders,           // User orders
  loyaltyPoints,    // Loyalty points
  // ... and more actions
} = useApp();
```

## 🌐 Environment

- **Development**: Vite dev server on port 5173
- **Production**: Static HTML, CSS, JS files

## 📝 License

MIT License - feel free to use in your projects!

---

For detailed features and documentation, see [FEATURES.md](./FEATURES.md)
