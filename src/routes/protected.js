import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /protected/profile - guarded by requireAuth middleware
router.get('/profile', requireAuth, (req, res) => {
  return res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    created_at: req.user.created_at
  });
});

// GET /protected/dashboard - second protected route proving middleware reusability
router.get('/dashboard', requireAuth, (req, res) => {
  return res.status(200).json({
    message: `Welcome to your dashboard, ${req.user.email}!`,
    user_id: req.user.id,
    account_created: req.user.created_at,
    role: req.user.role || 'authenticated'
  });
});

// GET /protected/admin - Stretch Goal: Demonstrating HTTP 403 Forbidden vs 401 Unauthorized
// 401 = "I don't know who you are" (Missing or invalid token)
// 403 = "I know who you are, but you are not allowed" (Authenticated, but insufficient privileges)
router.get('/admin', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin' || req.user.email === 'admin@flyrank.io';

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden: Admin access required. 401 proves identity; 403 enforces permission.'
    });
  }

  return res.status(200).json({
    message: 'Welcome to the privileged Admin Console!',
    admin_user: req.user.email,
    timestamp: new Date().toISOString()
  });
});

export default router;
