const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserBarnRole = require('../models/UserBarnRole');

// Authenticate user from JWT
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if this is a simple admin token (from /admin/login)
    if (decoded.role === 'admin' && decoded.email === 'admin@onstrideapp.com') {
      req.user = { accountType: 'admin', email: decoded.email, name: 'Admin' };
      req.userId = 'admin';
      return next();
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
      req.userId = user._id;
    }
    next();
  } catch (error) {
    next();
  }
};

// Load barn context from header or user's primary barn
const loadBarnContext = async (req, res, next) => {
  try {
    // Check for barn ID in header
    const barnId = req.headers['x-barn-id'];

    if (barnId) {
      // Verify user has access to this barn
      const role = await UserBarnRole.findOne({
        userId: req.userId,
        barnId,
        status: 'active'
      });

      if (!role) {
        return res.status(403).json({ error: 'No access to this barn' });
      }

      req.barnId = barnId;
      req.barnRole = role;
    } else if (req.user?.barnId) {
      // Fall back to user's default barn - also load their role
      req.barnId = req.user.barnId;
      const role = await UserBarnRole.findOne({
        userId: req.userId,
        barnId: req.user.barnId,
        status: 'active'
      });
      req.barnRole = role;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require barn context
const requireBarn = (req, res, next) => {
  if (!req.barnId) {
    return res.status(400).json({ error: 'Barn context required' });
  }
  next();
};

// Check if user has specific permission
const hasPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const barnRole = req.barnRole;

      // Platform admins have all permissions
      if (user.accountType === 'admin') {
        return next();
      }

      // Check barn role permissions if available
      if (barnRole) {
        const hasAllPermissions = permissions.every(p =>
          barnRole.permissions.includes(p) ||
          barnRole.role === 'owner' ||
          barnRole.role === 'admin'
        );

        if (hasAllPermissions) {
          return next();
        }
      }

      // Check user-level permissions
      const hasAllPermissions = permissions.every(p =>
        user.permissions.includes(p) ||
        user.accountType === 'owner'
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has one of the specified roles
const hasRole = (...roles) => {
  return (req, res, next) => {
    const user = req.user;
    const barnRole = req.barnRole;

    // Platform admins pass all role checks
    if (user.accountType === 'admin') {
      return next();
    }

    // Check barn role if available
    if (barnRole && roles.includes(barnRole.role)) {
      return next();
    }

    // Check user account type
    if (roles.includes(user.accountType)) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient role' });
  };
};

// Check if user is staff (owner, admin, manager, groomer, trainer)
const isStaff = (req, res, next) => {
  const user = req.user;
  const barnRole = req.barnRole;
  const staffRoles = ['owner', 'admin', 'manager', 'groomer', 'trainer'];

  if (user.accountType === 'admin') {
    return next();
  }

  if (barnRole && staffRoles.includes(barnRole.role)) {
    return next();
  }

  if (staffRoles.includes(user.accountType)) {
    return next();
  }

  return res.status(403).json({ error: 'Staff access required' });
};

// Check if user owns the resource or is staff
const ownsResourceOrStaff = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const resourceUserId = await getResourceUserId(req);

      // Staff can access any resource
      const staffRoles = ['owner', 'admin', 'manager', 'groomer', 'trainer'];
      if (user.accountType === 'admin' || staffRoles.includes(user.accountType)) {
        return next();
      }

      if (req.barnRole && staffRoles.includes(req.barnRole.role)) {
        return next();
      }

      // Check if user owns the resource
      if (resourceUserId && resourceUserId.toString() === req.userId.toString()) {
        return next();
      }

      return res.status(403).json({ error: 'Access denied' });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  loadBarnContext,
  requireBarn,
  hasPermission,
  hasRole,
  isStaff,
  ownsResourceOrStaff
};
