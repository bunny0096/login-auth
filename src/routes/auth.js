import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {};

  // Validation: email and password must be present and non-empty
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string' || email.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim()
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data.user);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /auth/login (with brute-force protection rate limiting)
router.post('/login', loginRateLimiter, async (req, res) => {
  const { email, password } = req.body || {};

  // Validate empty fields -> 400
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string' || email.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim()
    });

    // If Supabase rejects the credentials, return 401 with {"error": "Invalid login credentials"}
    if (error || !data || !data.session) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type || 'bearer',
      user: data.user
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /auth/refresh (Stretch Goal: Refresh Token Exchange)
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body || {};

  if (!refresh_token || typeof refresh_token !== 'string' || refresh_token.trim() === '') {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh_token.trim()
    });

    if (error || !data || !data.session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type || 'bearer',
      user: data.user
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /auth/logout (Protected route - uses requireAuth guard)
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // Return 204 ("No Content") on success
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
