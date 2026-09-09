// Quarantined AI Version generated in Stage 7 Rematch
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_KEY || 'example_key'
);

// AI Auth Middleware
// Notice flaw 1: doesn't strictly verify 'Bearer ' prefix; split(' ')[1] crashes or returns undefined on malformed headers
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Flaw 2: AI silently assumes split(' ') always yields a second element
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Malformed token' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    // Flaw 3: In some cases, AI returns 500 on token errors instead of 401
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Routes
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  // Flaw 4: Missing string type check or empty whitespace trim check
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data.user);
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Invalid login credentials' });
  res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
});

app.post('/auth/logout', authMiddleware, async (req, res) => {
  await supabase.auth.signOut();
  res.status(204).send();
});

app.get('/public/info', (req, res) => {
  res.status(200).json({ message: 'Welcome to the public API' });
});

app.get('/protected/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    id: req.user.id,
    email: req.user.email
  });
});

// Basic Swagger mock definition
const swaggerDocument = {
  openapi: '3.0.0',
  info: { title: 'AI Auth API', version: '1.0.0' },
  paths: {}
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;
