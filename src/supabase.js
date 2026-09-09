import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your_anon_key_here';

const isPlaceholder = !process.env.SUPABASE_URL ||
  process.env.SUPABASE_URL.includes('your-project-id') ||
  !process.env.SUPABASE_KEY ||
  process.env.SUPABASE_KEY.includes('your_anon_key');

// In-memory store for local testing when Supabase credentials are placeholder
const mockUsers = new Map();
const JWT_SECRET = 'antigravity-dev-mock-jwt-secret-key';

function createMockJWT(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role || 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyMockJWT(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

const mockAuthClient = {
  auth: {
    async signUp({ email, password }) {
      if (!email || !password) {
        return { data: { user: null }, error: { message: 'Email and password are required' } };
      }
      if (mockUsers.has(email)) {
        return { data: { user: null }, error: { message: 'User already registered' } };
      }
      const user = {
        id: crypto.randomUUID(),
        email,
        password,
        role: 'authenticated',
        created_at: new Date().toISOString()
      };
      mockUsers.set(email, user);
      const safeUser = { id: user.id, email: user.email, role: user.role, created_at: user.created_at };
      return { data: { user: safeUser }, error: null };
    },

    async signInWithPassword({ email, password }) {
      const user = mockUsers.get(email);
      if (!user || user.password !== password) {
        return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
      }
      const access_token = createMockJWT(user);
      const refresh_token = `ref_${crypto.randomBytes(16).toString('hex')}`;
      user.refresh_token = refresh_token;
      const safeUser = { id: user.id, email: user.email, role: user.role, created_at: user.created_at };
      return {
        data: {
          user: safeUser,
          session: {
            access_token,
            refresh_token,
            token_type: 'bearer',
            expires_in: 3600
          }
        },
        error: null
      };
    },

    async getUser(token) {
      const payload = verifyMockJWT(token);
      if (!payload) {
        return { data: { user: null }, error: { message: 'Invalid or expired token' } };
      }
      return {
        data: {
          user: {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            created_at: new Date().toISOString()
          }
        },
        error: null
      };
    },

    async signOut() {
      return { error: null };
    },

    async refreshSession({ refresh_token }) {
      if (!refresh_token) {
        return { data: { session: null, user: null }, error: { message: 'Refresh token is required' } };
      }
      for (const [, user] of mockUsers.entries()) {
        if (user.refresh_token === refresh_token) {
          const newAccess = createMockJWT(user);
          const newRefresh = `ref_${crypto.randomBytes(16).toString('hex')}`;
          user.refresh_token = newRefresh;
          return {
            data: {
              session: {
                access_token: newAccess,
                refresh_token: newRefresh,
                token_type: 'bearer',
                expires_in: 3600
              },
              user: { id: user.id, email: user.email, role: user.role, created_at: user.created_at }
            },
            error: null
          };
        }
      }
      return { data: { session: null, user: null }, error: { message: 'Invalid refresh token' } };
    }
  }
};

let clientInstance;
if (isPlaceholder) {
  console.log('ℹ️  Running in mock/local mode (placeholder Supabase keys detected). Real API shapes are preserved.');
  clientInstance = mockAuthClient;
} else {
  console.log(`📡 Connecting to live Supabase at: ${supabaseUrl}`);
  clientInstance = createClient(supabaseUrl, supabaseKey);
}

export const supabase = clientInstance;
export { isPlaceholder };
