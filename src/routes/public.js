import { Router } from 'express';

const router = Router();

// GET /public/info
router.get('/info', (req, res) => {
  return res.status(200).json({
    message: 'Welcome stranger! This info is public.'
  });
});

export default router;
