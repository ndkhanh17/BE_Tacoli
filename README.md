# Tacoli Tea Backend API

This is the backend API for the Tacoli Tea e-commerce website.

## Features

- User authentication and authorization
- Product management
- Category management
- Order processing
- Blog/News management
- Admin dashboard

## Tech Stack

- Node.js
- Express.js
- MongoDB (using native driver)
- JWT for authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

\`\`\`bash
npm install
\`\`\`

4. Create a `.env` file based on the `.env.example` file
5. Start the development server:

\`\`\`bash
npm run dev
\`\`\`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Product Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/search` - Search products
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Category Endpoints

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Order Endpoints

- `POST /api/orders` - Create order
- `GET /api/orders/track/:orderId` - Track order
- `GET /api/orders/my-orders` - Get user orders (authenticated)
- `GET /api/orders/my-orders/:id` - Get user order by ID (authenticated)
- `GET /api/orders` - Get all orders (admin only)
- `GET /api/orders/:id` - Get order by ID (admin only)
- `PUT /api/orders/:id/status` - Update order status (admin only)

### User Endpoints

- `GET /api/users/profile` - Get user profile (authenticated)
- `PUT /api/users/profile` - Update user profile (authenticated)
- `PUT /api/users/change-password` - Change password (authenticated)
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Post/Blog Endpoints

- `GET /api/posts` - Get all posts
- `GET /api/posts/featured` - Get featured posts
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/category/:category` - Get posts by category
- `GET /api/posts/tag/:tag` - Get posts by tag
- `POST /api/posts` - Create post (admin only)
- `PUT /api/posts/:id` - Update post (admin only)
- `DELETE /api/posts/:id` - Delete post (admin only)

### Admin Endpoints

- `GET /api/admin/dashboard` - Get dashboard stats (admin only)
- `GET /api/admin/users` - Get admin users (admin only)
- `POST /api/admin/users` - Create admin user (admin only)
- `PUT /api/admin/users/:id` - Update admin user (admin only)
- `DELETE /api/admin/users/:id` - Delete admin user (admin only)
- `GET /api/admin/roles` - Get roles (admin only)
- `POST /api/admin/roles` - Create role (admin only)
- `PUT /api/admin/roles/:id` - Update role (admin only)
- `DELETE /api/admin/roles/:id` - Delete role (admin only)

## License

MIT
