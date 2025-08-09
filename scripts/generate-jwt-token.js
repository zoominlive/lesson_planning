#!/usr/bin/env node

/**
 * JWT Token Generator for Lesson Planning Application
 * 
 * This script generates a valid JWT token for testing the lesson planning application.
 * 
 * Usage:
 *   node generate-jwt-token.js
 * 
 * Environment Variables Required:
 *   - JWT_SECRET: The JWT secret for your tenant (128-character hex string)
 *   - TENANT_ID: Your assigned tenant ID (UUID)
 * 
 * Optional Environment Variables:
 *   - USER_ID: User identifier (defaults to sample UUID)
 *   - USER_FIRST_NAME: User's first name (defaults to "Test")
 *   - USER_LAST_NAME: User's last name (defaults to "User")
 *   - USERNAME: Username (defaults to "test.user")
 *   - ROLE: User role (defaults to "teacher", can be "admin")
 *   - LOCATIONS: Comma-separated list of location names (defaults to "Main Campus,West Wing")
 *   - TOKEN_EXPIRY: Token expiry time in seconds (defaults to 3600 = 1 hour)
 */

import jwt from 'jsonwebtoken';

// Configuration from environment variables with defaults
const config = {
  jwtSecret: process.env.JWT_SECRET || '4f245b088aea6deb51e32e2042019f1b2cf9f8a935ee05c42bfe5dba981df7dcdc7b67a82c1ef191558d58547db133b73966daa14cada97aa3e008d32fbe6509',
  tenantId: process.env.TENANT_ID || '7cb6c28d-164c-49fa-b461-dfc47a8a3fed',
  userId: process.env.USER_ID || '12345678-90ab-cdef-1234-567890abcdef',
  userFirstName: process.env.USER_FIRST_NAME || 'Test',
  userLastName: process.env.USER_LAST_NAME || 'User',
  username: process.env.USERNAME || 'test.user',
  role: process.env.ROLE || 'teacher',
  locations: process.env.LOCATIONS ? process.env.LOCATIONS.split(',').map(l => l.trim()) : ['Main Campus', 'West Wing'],
  tokenExpiry: parseInt(process.env.TOKEN_EXPIRY || '3600', 10)
};

/**
 * Generate a JWT token with the required payload structure
 */
function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    // Required fields
    tenantId: config.tenantId,
    userFirstName: config.userFirstName,
    userLastName: config.userLastName,
    username: config.username,
    role: config.role,
    locations: config.locations,  // Array of location names user can access
    
    // Optional fields
    userId: config.userId,
    
    // Standard JWT fields
    iat: now,  // Issued at
    exp: now + config.tokenExpiry  // Expires at
  };

  return jwt.sign(payload, config.jwtSecret, { algorithm: 'HS256' });
}

/**
 * Decode and display a JWT token (for verification)
 */
function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error.message);
    return null;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Lesson Planning Application - JWT Token Generator');
  console.log('==================================================\n');
  
  console.log('Configuration:');
  console.log(`  Tenant ID: ${config.tenantId}`);
  console.log(`  User: ${config.userFirstName} ${config.userLastName} (${config.username})`);
  console.log(`  Role: ${config.role}`);
  console.log(`  Locations: ${config.locations.join(', ')}`);
  console.log(`  Token Expiry: ${config.tokenExpiry} seconds\n`);
  
  // Generate token
  const token = generateToken();
  
  console.log('Generated JWT Token:');
  console.log('--------------------');
  console.log(token);
  console.log('\n');
  
  // Decode and verify
  const decoded = decodeToken(token);
  if (decoded) {
    console.log('Token Payload (Decoded):');
    console.log('------------------------');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('\n');
    
    // Calculate expiry time
    const expiryDate = new Date(decoded.exp * 1000);
    console.log(`Token expires at: ${expiryDate.toISOString()}`);
  }
  
  console.log('\n');
  console.log('Usage Examples:');
  console.log('---------------');
  console.log(`1. URL Parameter Method:`);
  console.log(`   https://your-app-url.com/?token=${token}\n`);
  
  console.log(`2. PostMessage Method:`);
  console.log(`   iframe.contentWindow.postMessage({ type: 'AUTH_TOKEN', token: '${token}' }, '*');\n`);
  
  console.log(`3. Test with curl:`);
  console.log(`   curl -H "Authorization: Bearer ${token}" https://your-app-url.com/api/user\n`);
}

// Check if jsonwebtoken is installed
try {
  require.resolve('jsonwebtoken');
  main();
} catch (error) {
  console.error('Error: jsonwebtoken package is not installed.');
  console.error('Please run: npm install jsonwebtoken');
  process.exit(1);
}