import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware for POST /auth/login
 * Defends against automated brute-force password guessing attacks
 * Limits requests to 10 attempts per 15-minute window per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts from this IP, please try again after 15 minutes.'
    });
  }
});
