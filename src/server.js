import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Stage 0 Checkpoint verification endpoint
app.get('/', (req, res) => {
  res.json({ message: 'FlyRank Auth API is up and running' });
});

app.listen(PORT, () => {
  console.log(`Server running and connected to Supabase on port ${PORT}`);
});

export default app;
