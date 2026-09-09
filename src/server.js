import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import protectedRoutes from './routes/protected.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load Swagger document
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../swagger.json'), 'utf8')
);

// Mount Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routes
app.use('/auth', authRoutes);
app.use('/public', publicRoutes);
app.use('/protected', protectedRoutes);

// Root redirect to /docs
app.get('/', (req, res) => {
  res.redirect('/docs');
});

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running and connected to Supabase on port ${PORT}`);
    console.log(`Swagger UI documentation available at http://localhost:${PORT}/docs`);
  });
}

export { app, server };
export default app;
