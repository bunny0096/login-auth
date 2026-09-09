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

export default router;
