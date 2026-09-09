import http from 'http';
import { app } from '../src/server.js';

const PORT = 3001;

async function runTests() {
  console.log('🚀 Starting Comprehensive API Test Suite on port', PORT);
  const server = app.listen(PORT);

  const BASE_URL = `http://localhost:${PORT}`;
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. GET /public/info -> 200
    const pubRes = await fetch(`${BASE_URL}/public/info`);
    const pubData = await pubRes.json();
    assert(pubRes.status === 200, 'GET /public/info returns 200');
    assert(pubData.message === 'Welcome stranger! This info is public.', 'GET /public/info has correct public message');

    // 2. POST /auth/signup missing fields -> 400
    const badSignup = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad@example.com' })
    });
    const badSignupData = await badSignup.json();
    assert(badSignup.status === 400, 'POST /auth/signup with missing password returns 400');
    assert(badSignupData.error.includes('required'), 'POST /auth/signup returns descriptive error JSON');

    // 3. POST /auth/signup valid -> 201
    const goodSignup = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'intern@flyrank.io', password: 'SuperSecretPassword123' })
    });
    const goodSignupData = await goodSignup.json();
    assert(goodSignup.status === 201, 'POST /auth/signup returns 201 Created');
    assert(goodSignupData.email === 'intern@flyrank.io', 'POST /auth/signup returns user object');

    // 4. POST /auth/login wrong password -> 401
    const badLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'intern@flyrank.io', password: 'WrongPassword' })
    });
    const badLoginData = await badLogin.json();
    assert(badLogin.status === 401, 'POST /auth/login with wrong credentials returns 401');
    assert(badLoginData.error === 'Invalid login credentials', 'POST /auth/login returns exact error message');

    // 5. POST /auth/login valid -> 200 with tokens
    const goodLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'intern@flyrank.io', password: 'SuperSecretPassword123' })
    });
    const loginData = await goodLogin.json();
    assert(goodLogin.status === 200, 'POST /auth/login returns 200 OK');
    assert(typeof loginData.access_token === 'string' && loginData.access_token.length > 20, 'POST /auth/login returns access_token JWT');
    assert(typeof loginData.refresh_token === 'string', 'POST /auth/login returns refresh_token');

    const token = loginData.access_token;
    const refreshToken = loginData.refresh_token;

    // 6. GET /protected/profile without token -> 401
    const noTokenRes = await fetch(`${BASE_URL}/protected/profile`);
    const noTokenData = await noTokenRes.json();
    assert(noTokenRes.status === 401, 'GET /protected/profile without token returns 401');
    assert(noTokenData.error === 'Access token required', 'GET /protected/profile without token returns "Access token required"');

    // 7. GET /protected/profile with forged/tampered token -> 401
    const tamperedToken = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a') + token.slice(-1);
    const tamperedRes = await fetch(`${BASE_URL}/protected/profile`, {
      headers: { 'Authorization': `Bearer ${tamperedToken}` }
    });
    const tamperedData = await tamperedRes.json();
    assert(tamperedRes.status === 401, 'GET /protected/profile with tampered token returns 401');
    assert(tamperedData.error === 'Invalid or expired token', 'GET /protected/profile with tampered token returns "Invalid or expired token"');

    // 8. GET /protected/profile with valid token -> 200 with safe metadata
    const profileRes = await fetch(`${BASE_URL}/protected/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, 'GET /protected/profile with valid token returns 200');
    assert(profileData.email === 'intern@flyrank.io', 'GET /protected/profile returns user email');
    assert(profileData.id !== undefined && profileData.created_at !== undefined, 'GET /protected/profile returns safe metadata (id, email, created_at)');

    // 9. GET /protected/dashboard with same middleware -> 200
    const dashRes = await fetch(`${BASE_URL}/protected/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(dashRes.status === 200, 'GET /protected/dashboard (second protected route) returns 200');

    // 10. GET /protected/admin without admin privileges -> 403 Forbidden
    const adminForbiddenRes = await fetch(`${BASE_URL}/protected/admin`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const adminForbiddenData = await adminForbiddenRes.json();
    assert(adminForbiddenRes.status === 403, 'GET /protected/admin for regular user returns 403 Forbidden');
    assert(adminForbiddenData.error.includes('Forbidden'), 'GET /protected/admin error message clarifies permission denial');

    // 11. POST /auth/refresh -> 200 with new access token
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    const refreshData = await refreshRes.json();
    assert(refreshRes.status === 200, 'POST /auth/refresh returns 200 OK');
    assert(typeof refreshData.access_token === 'string', 'POST /auth/refresh provides new access token');

    // 12. POST /auth/logout with valid token -> 204 No Content
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(logoutRes.status === 204, 'POST /auth/logout with valid token returns 204 No Content');

    // 13. POST /auth/logout without token -> 401
    const logoutNoAuth = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST'
    });
    assert(logoutNoAuth.status === 401, 'POST /auth/logout without token returns 401 Unauthorized');

    console.log(`\n🎉 Test Suite Completed: ${passed} passed, ${failed} failed.\n`);
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Unexpected error in test runner:', err);
    server.close();
    process.exit(1);
  }
}

runTests();
