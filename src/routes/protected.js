import { Router } from 'express';

const router = Router();

// GET /protected/profile (Stage 2: unverified token extraction)
router.get('/profile', (req, res) => {
  const authHeader = req.headers['authorization'];

  // Check if header is missing, malformed, or has no token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // In Stage 2, token is not verified yet, just checking one was presented
  return res.status(200).json({
    message: 'Access token presented',
    token
  });
});

export default router;
