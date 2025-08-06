# Lesson Planning Application - Integration Guide

This guide explains how to integrate the Lesson Planning Application into your existing system using JWT authentication.

## Overview

The lesson planning application supports secure iframe integration through JWT token authentication. Parent applications can pass user context and maintain secure communication with the embedded application.

## JWT Authentication Setup

### 1. Tenant and Secret Configuration

Currently, tenants and JWT secrets are created manually in our database. Contact our team to set up:

- **Tenant ID**: A unique UUID for your organization
- **JWT Secret**: A 128-character hexadecimal secret for token signing

**Example Configuration:**
```
Tenant ID: 7cb6c28d-164c-49fa-b461-dfc47a8a3fed
JWT Secret: 4f245b088aea6deb51e32e2042019f1b2cf9f8a935ee05c42bfe5dba981df7dcdc7b67a82c1ef191558d58547db133b73966daa14cada97aa3e008d32fbe6509
```

### 2. JWT Token Generation

Your parent application must generate JWT tokens with the following required payload:

```javascript
const jwt = require('jsonwebtoken');

const payload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed", // Your assigned tenant ID
  userId: "user123",                                  // Optional: User identifier
  userFirstName: "John",                              // Required: User's first name
  userLastName: "Doe",                                // Required: User's last name
  username: "john.doe",                               // Required: Username
  role: "teacher",                                    // Required: User role (teacher, admin, etc.)
  iat: Math.floor(Date.now() / 1000),                // Issued at
  exp: Math.floor(Date.now() / 1000) + (60 * 60)     // Expires in 1 hour
};

const token = jwt.sign(payload, YOUR_JWT_SECRET);
```

### 3. Iframe Integration Methods

#### Method 1: Query Parameter (Recommended)

Pass the JWT token directly in the URL:

```html
<iframe 
  id="lesson-planner"
  src="https://your-lesson-planner-domain.com/?token=YOUR_JWT_TOKEN_HERE"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

**Security Features:**
- Token is automatically removed from URL after processing
- Prevents token exposure in browser history
- No additional JavaScript required

#### Method 2: PostMessage (Fallback)

Send token via JavaScript message:

```html
<iframe 
  id="lesson-planner"
  src="https://your-lesson-planner-domain.com"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>

<script>
const iframe = document.getElementById('lesson-planner');

iframe.onload = function() {
  iframe.contentWindow.postMessage({
    type: 'AUTH_TOKEN',
    token: 'YOUR_JWT_TOKEN_HERE'
  }, '*');
};
</script>
```

### 4. User Context Access

Once authenticated, the application displays user information and provides access to user context through:

- **User Info Display**: Shows user name, username, and role in the navigation
- **API Context**: All API requests include user context for data filtering
- **Personalization**: User-specific settings and preferences

## API Endpoints

All API endpoints support tenant-based data isolation:

### Authentication
- `GET /api/user` - Get current user information from JWT token

### Milestones
- `GET /api/milestones` - Retrieve all developmental milestones
- `POST /api/milestones` - Create a new milestone
- `PUT /api/milestones/:id` - Update existing milestone
- `DELETE /api/milestones/:id` - Delete milestone

### Activities
- `GET /api/activities` - Retrieve all activities
- `POST /api/activities` - Create a new activity
- `PUT /api/activities/:id` - Update existing activity
- `DELETE /api/activities/:id` - Delete activity

### Materials
- `GET /api/materials` - Retrieve all materials
- `POST /api/materials` - Create a new material
- `PUT /api/materials/:id` - Update existing material
- `DELETE /api/materials/:id` - Delete material

### Lesson Plans
- `GET /api/lesson-plans` - Retrieve all lesson plans
- `POST /api/lesson-plans` - Create a new lesson plan
- `PUT /api/lesson-plans/:id` - Update existing lesson plan
- `DELETE /api/lesson-plans/:id` - Delete lesson plan

### Scheduled Activities
- `GET /api/scheduled-activities` - Retrieve all scheduled activities
- `POST /api/scheduled-activities` - Create a new scheduled activity
- `PUT /api/scheduled-activities/:id` - Update existing scheduled activity
- `DELETE /api/scheduled-activities/:id` - Delete scheduled activity

## Implementation Examples

### Node.js JWT Token Generation

```javascript
const jwt = require('jsonwebtoken');

function generateLessonPlannerToken(user) {
  const payload = {
    tenantId: process.env.LESSON_PLANNER_TENANT_ID,
    userId: user.id,
    userFirstName: user.firstName,
    userLastName: user.lastName,
    username: user.username,
    role: user.role || 'teacher',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  return jwt.sign(payload, process.env.LESSON_PLANNER_JWT_SECRET);
}

// Usage
app.get('/embed-lesson-planner/:userId', (req, res) => {
  const user = getUserById(req.params.userId);
  const token = generateLessonPlannerToken(user);
  
  const iframeUrl = `${process.env.LESSON_PLANNER_URL}/?token=${token}`;
  
  res.render('lesson-planner-embed', { iframeUrl });
});
```

### PHP JWT Token Generation

```php
<?php
require_once 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function generateLessonPlannerToken($user) {
    $payload = array(
        'tenantId' => $_ENV['LESSON_PLANNER_TENANT_ID'],
        'userId' => $user['id'],
        'userFirstName' => $user['first_name'],
        'userLastName' => $user['last_name'],
        'username' => $user['username'],
        'role' => $user['role'] ?: 'teacher',
        'iat' => time(),
        'exp' => time() + 3600 // 1 hour
    );
    
    return JWT::encode($payload, $_ENV['LESSON_PLANNER_JWT_SECRET'], 'HS256');
}
?>
```

## Security Considerations

1. **Token Expiration**: Keep token lifetimes short (1-4 hours recommended)
2. **Secret Management**: Store JWT secrets securely using environment variables
3. **HTTPS Only**: Always use HTTPS for production deployments
4. **Origin Validation**: Validate iframe origins in production environments
5. **Token Refresh**: Implement token refresh mechanisms for long sessions

## Troubleshooting

### Common Issues

**Invalid Token Error:**
- Verify tenant ID matches your assigned value
- Check JWT secret is correct
- Ensure all required payload fields are present
- Validate token hasn't expired

**User Info Not Displayed:**
- Confirm userFirstName, userLastName, username, and role are in JWT payload
- Check token is being passed correctly via query parameter or postMessage
- Verify iframe has loaded completely before sending postMessage

**API Access Issues:**
- Ensure tenant is active in our system
- Verify JWT secret is active and matches database
- Check token format and signing algorithm (HS256)

### Development Mode

For development and testing, the application runs with mock user data:
- Tenant ID: `7cb6c28d-164c-49fa-b461-dfc47a8a3fed`
- User: Dev User (@dev-user, teacher role)

## Support

For tenant setup, JWT secret generation, or integration assistance, contact our development team with your:
- Organization name
- Expected usage volume
- Integration timeline
- Technical contact information