import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /protected/profile (Stage 3: Token verification with Supabase)
router.get('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];

  // Check if header is missing, malformed, or has no token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    // If the token is expired, tampered with, or invalid -> return 401
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Return safe user metadata: id, email, account-created date
    return res.status(200).json({
      id: data.user.id,
      email: data.user.email,
      created_at: data.user.created_at
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
