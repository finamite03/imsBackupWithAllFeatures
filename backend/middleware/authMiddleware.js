import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// Protect routes - verify JWT token
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Manager middleware
export const manager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a manager');
  }
};

// Role-based access control
export const hasPermission = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const userRole = req.user.role;
    
    // Admin has access to everything
    if (userRole === 'admin') {
      return next();
    }

    // Check if user role is in required roles
    if (requiredRoles.includes(userRole)) {
      return next();
    }

    res.status(403);
    throw new Error(`Access denied. Required role(s): ${requiredRoles.join(', ')}`);
  };
};

// Check specific permissions
export const canManageUsers = hasPermission(['admin']);
export const canManageInventory = hasPermission(['admin', 'manager']);
export const canViewReports = hasPermission(['admin', 'manager']);
export const canManageSales = hasPermission(['admin', 'manager']);
export const canManagePurchases = hasPermission(['admin', 'manager']);
export const canApprove = hasPermission(['admin', 'manager']);