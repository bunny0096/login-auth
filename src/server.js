import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mount auth routes
app.use('/auth', authRoutes);

// Root checkpoint endpoint
app.get('/', (req, res) => {
  res.json({ message: 'FlyRank Auth API is up and running' });
});

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running and connected to Supabase on port ${PORT}`);
  });
}

export { app, server };
export default app;
