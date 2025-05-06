const { ObjectId } = require('mongodb');
const { getDb } = require('../config/database');
const { ApiError } = require('../utils/ApiError');

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const db = getDb();
    
    // Get counts from different collections
    const userCount = await db.collection('users').countDocuments();
    const productCount = await db.collection('products').countDocuments();
    const orderCount = await db.collection('orders').countDocuments();
    const postCount = await db.collection('posts').countDocuments();
    
    // Get recent orders
    const recentOrders = await db.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    // Get revenue statistics
    const completedOrders = await db.collection('orders')
      .find({ status: 'completed' })
      .toArray();
    
    const totalRevenue = completedOrders.reduce((total, order) => total + order.totalAmount, 0);
    
    // Get top selling products
    const topProducts = await db.collection('products')
      .find({})
      .sort({ soldCount: -1 })
      .limit(5)
      .toArray();
    
    res.status(200).json({
      success: true,
      data: {
        counts: {
          users: userCount,
          products: productCount,
          orders: orderCount,
          posts: postCount
        },
        recentOrders,
        revenue: {
          total: totalRevenue,
          orderCount: completedOrders.length
        },
        topProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin users
 */
exports.getAdminUsers = async (req, res, next) => {
  try {
    const db = getDb();
    
    const adminUsers = await db.collection('users')
      .find({ role: { $in: ['admin', 'editor'] } })
      .toArray();
    
    res.status(200).json({
      success: true,
      count: adminUsers.length,
      data: adminUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create admin user
 */
exports.createAdminUser = async (req, res, next) => {
  try {
    const db = getDb();
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    
    if (existingUser) {
      return next(new ApiError(400, 'User with this email already exists'));
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: role || 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        _id: result.insertedId,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin user
 */
exports.updateAdminUser = async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    // Check if user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await db.collection('users').findOne({ email });
      
      if (existingUser) {
        return next(new ApiError(400, 'Email is already taken'));
      }
    }
    
    // Update user
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    // Remove password from response
    const { password, ...userWithoutPassword } = result;
    
    res.status(200).json({
      success: true,
      message: 'Admin user updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete admin user
 */
exports.deleteAdminUser = async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Check if user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Delete user
    await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    
    res.status(200).json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get roles
 */
exports.getRoles = async (req, res, next) => {
  try {
    const db = getDb();
    
    const roles = await db.collection('roles').find({}).toArray();
    
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create role
 */
exports.createRole = async (req, res, next) => {
  try {
    const db = getDb();
    const { name, permissions } = req.body;
    
    // Check if role already exists
    const existingRole = await db.collection('roles').findOne({ name });
    
    if (existingRole) {
      return next(new ApiError(400, 'Role with this name already exists'));
    }
    
    // Create new role
    const newRole = {
      name,
      permissions: permissions || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('roles').insertOne(newRole);
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: {
        _id: result.insertedId,
        ...newRole
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update role
 */
exports.updateRole = async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, permissions } = req.body;
    
    // Check if role exists
    const role = await db.collection('roles').findOne({ _id: new ObjectId(id) });
    
    if (!role) {
      return next(new ApiError(404, 'Role not found'));
    }
    
    // Check if name is already taken by another role
    if (name && name !== role.name) {
      const existingRole = await db.collection('roles').findOne({ name });
      
      if (existingRole) {
        return next(new ApiError(400, 'Role name is already taken'));
      }
    }
    
    // Update role
    const updateData = {
      ...(name && { name }),
      ...(permissions && { permissions }),
      updatedAt: new Date()
    };
    
    const result = await db.collection('roles').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete role
 */
exports.deleteRole = async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Check if role exists
    const role = await db.collection('roles').findOne({ _id: new ObjectId(id) });
    
    if (!role) {
      return next(new ApiError(404, 'Role not found'));
    }
    
    // Check if role is in use
    const usersWithRole = await db.collection('users').countDocuments({ role: role.name });
    
    if (usersWithRole > 0) {
      return next(new ApiError(400, 'Role is in use and cannot be deleted'));
    }
    
    // Delete role
    await db.collection('roles').deleteOne({ _id: new ObjectId(id) });
    
    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
