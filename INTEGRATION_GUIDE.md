
# Multi-Tenant Integration Guide

This guide explains how to integrate this lesson planning application as an iframe with tenant-specific authentication.

## Setup Process

### 1. Create a Tenant
First, create a tenant in the lesson planning app:

```bash
curl -X POST https://your-app-domain.replit.dev/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your School District",
    "isActive": true
  }'
```

This will return a tenant object with an `id` and `jwtSecret`. **Store the `jwtSecret` securely** - you'll need it to sign tokens.

### 2. Generate JWT Tokens
In your parent application, generate JWT tokens for users accessing the iframe:

```javascript
const jwt = require('jsonwebtoken');

function generateLessonPlanToken(tenantId, userId, jwtSecret) {
  const payload = {
    tenantId: tenantId,
    userId: userId, // optional - for tracking specific users
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
  };
  
  return jwt.sign(payload, jwtSecret);
}
```

### 3. Embed as Iframe
Create an iframe that passes the JWT token:

```html
<iframe 
  id="lesson-planner"
  src="https://your-app-domain.replit.dev"
  width="100%" 
  height="600"
  frameborder="0">
</iframe>

<script>
// Pass the token via postMessage after iframe loads
document.getElementById('lesson-planner').onload = function() {
  const token = generateLessonPlanToken(tenantId, userId, jwtSecret);
  this.contentWindow.postMessage({
    type: 'AUTH_TOKEN',
    token: token
  }, 'https://your-app-domain.replit.dev');
};
</script>
```

### 4. Security Headers
The lesson planning app will include appropriate iframe security headers and CORS policies to ensure secure embedding.

## Token Requirements

Your JWT tokens must include:
- `tenantId`: Your tenant ID from step 1
- `userId`: (optional) Specific user identifier
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (recommended: 1 hour)

## Data Isolation

Each tenant's data is completely isolated:
- Users can only see lesson plans for their tenant
- Materials and activities can be shared or tenant-specific
- All API calls are automatically filtered by tenant ID

## Security Features

- JWT tokens are validated on every API request
- Tenant secrets are stored securely in the database
- Inactive tenants are automatically blocked
- All data access is tenant-scoped
