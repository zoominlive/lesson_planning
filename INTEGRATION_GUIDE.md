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
  role: "teacher",                                    // Required: User role (teacher, assistant_director, director, admin, superadmin)
  locations: ["Main Campus", "West Wing"],           // Required: Array of location names user can access
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

- **User Info Display**: Shows user name, username, role, and authorized locations in the navigation
- **Location-Based Access**: Users can only access data for locations specified in their JWT token
- **API Context**: All API requests include user context for data filtering and location validation
- **Role-Based Access**: Admin users see additional settings management features
- **Personalization**: User-specific settings and preferences

#### Admin Features
Users with "Admin" role in their JWT token have access to:
- Settings management via gear icon in header
- Location, room, category, and age group management
- Organizational configuration tools

## API Endpoints

All API endpoints support tenant-based data isolation with location-based authorization:

### Location-Based Authorization

**Important:** Users can only access data for locations specified in their JWT token's `locations` array. The server validates location access on every API request.

- **locations** (JWT payload): Array of location names (strings) the user is authorized to access
- **Server-Side Validation**: All endpoints validate user has access to requested location
- **403 Forbidden**: Returned when user lacks access to the requested location

### Multi-Location Query Parameters

Lesson plan related endpoints now support location-based filtering:
- **locationId** (query parameter): Filter results by specific location
- **roomId** (query parameter): Filter results by specific room (for lesson plans and scheduled activities)

### Authentication
- `GET /api/user` - Get current user information from JWT token

### Milestones
- `GET /api/milestones?locationId={locationId}` - Retrieve developmental milestones, optionally filtered by location
- `POST /api/milestones` - Create a new milestone (requires tenantId + locationId in body)
- `PUT /api/milestones/:id` - Update existing milestone
- `DELETE /api/milestones/:id` - Delete milestone

### Activities
- `GET /api/activities?locationId={locationId}` - Retrieve activities, optionally filtered by location
- `POST /api/activities` - Create a new activity (requires tenantId + locationId in body)
- `PUT /api/activities/:id` - Update existing activity
- `DELETE /api/activities/:id` - Delete activity

### Materials
- `GET /api/materials?locationId={locationId}` - Retrieve materials, optionally filtered by location
- `POST /api/materials` - Create a new material (requires tenantId + locationId in body)
- `PUT /api/materials/:id` - Update existing material
- `DELETE /api/materials/:id` - Delete material

### Lesson Plans
- `GET /api/lesson-plans?teacherId={teacherId}&locationId={locationId}&roomId={roomId}` - Retrieve lesson plans with optional filtering
- `POST /api/lesson-plans` - Create a new lesson plan (requires tenantId + locationId + roomId in body)
- `PUT /api/lesson-plans/:id` - Update existing lesson plan
- `DELETE /api/lesson-plans/:id` - Delete lesson plan
- `POST /api/lesson-plans/:id/submit` - Submit lesson plan for review
- `POST /api/lesson-plans/:id/approve` - Approve submitted lesson plan (requires approval permission)
- `POST /api/lesson-plans/:id/reject` - Reject submitted lesson plan (requires approval permission)

### Scheduled Activities
- `GET /api/lesson-plans/:lessonPlanId/scheduled-activities?locationId={locationId}&roomId={roomId}` - Retrieve scheduled activities with optional filtering
- `POST /api/scheduled-activities` - Create a new scheduled activity (requires tenantId + locationId + roomId in body)
- `PUT /api/scheduled-activities/:id` - Update existing scheduled activity
- `DELETE /api/scheduled-activities/:id` - Delete scheduled activity

### Settings Management (Admin Role Required)

#### Locations
- `GET /api/locations` - Retrieve all locations
- `POST /api/locations` - Create a new location
- `PUT /api/locations/:id` - Update existing location
- `DELETE /api/locations/:id` - Delete location

#### Rooms
- `GET /api/rooms` - Retrieve all rooms
- `GET /api/locations/:locationId/rooms` - Retrieve rooms by location
- `POST /api/rooms` - Create a new room
- `PUT /api/rooms/:id` - Update existing room
- `DELETE /api/rooms/:id` - Delete room

#### Categories
- `GET /api/categories` - Retrieve all categories
- `GET /api/categories?type=activity` - Retrieve categories by type (activity, material, milestone)
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update existing category
- `DELETE /api/categories/:id` - Delete category

#### Age Groups
- `GET /api/age-groups` - Retrieve all age groups
- `POST /api/age-groups` - Create a new age group
- `PUT /api/age-groups/:id` - Update existing age group
- `DELETE /api/age-groups/:id` - Delete age group

### Permission Management (Admin Role Required)

#### Permission Overrides
- `GET /api/permissions/overrides` - Retrieve organization permission overrides
- `POST /api/permissions/overrides` - Create permission override
- `PATCH /api/permissions/overrides/:id` - Update permission override

#### Permission Checking
- `POST /api/permissions/check` - Check if user has permission for specific action

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
    locations: user.authorizedLocations || [], // Array of location names
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
        'locations' => $user['authorized_locations'] ?: [], // Array of location names
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
- Confirm userFirstName, userLastName, username, role, and locations are in JWT payload
- Check token is being passed correctly via query parameter or postMessage
- Verify iframe has loaded completely before sending postMessage

**Location Access Denied:**
- Ensure locations array in JWT contains valid location names
- Verify user is attempting to access data only for authorized locations
- Check that location names match exactly with database records

**API Access Issues:**
- Ensure tenant is active in our system
- Verify JWT secret is active and matches database
- Check token format and signing algorithm (HS256)

### Development Mode

For development and testing, the application runs with mock user data:
- Tenant ID: `7cb6c28d-164c-49fa-b461-dfc47a8a3fed`
- User: Dev User (@dev-user, teacher role)
- Authorized Locations: ["Main Campus", "Third Location"]

## Postman Collection

A complete Postman collection with all API endpoints is available:

**Files:**
- `Lesson_Planning_API.postman_collection.json` - Complete API collection with examples
- `Lesson_Planning_API.postman_environment.json` - Environment variables and configuration

**Import Instructions:**
1. Open Postman
2. Click "Import" button
3. Select both JSON files
4. Update environment variables with your specific values:
   - `base_url`: Your API base URL
   - `jwt_token`: Your valid JWT token
   - `tenant_id`: Your assigned tenant ID

**Testing:**
- All endpoints include example requests and response validation
- Environment variables automatically populate IDs for chained requests
- Authentication is pre-configured using bearer token

## Data Models

### Core Entities

**Milestone:**
```json
{
  "id": "uuid",
  "tenantId": "uuid", 
  "title": "string",
  "description": "string",
  "domain": "Physical|Social|Emotional|Cognitive",
  "ageRangeStart": "number (months)",
  "ageRangeEnd": "number (months)"
}
```

**Activity:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "name": "string",
  "description": "string", 
  "objectives": "string[]",
  "materials": "string[]",
  "ageRangeStart": "number (months)",
  "ageRangeEnd": "number (months)",
  "duration": "number (minutes)",
  "groupSize": "number"
}
```

**Location (Admin Only):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "name": "string",
  "description": "string",
  "address": "string",
  "capacity": "number"
}
```

**Room (Admin Only):**
```json
{
  "id": "uuid", 
  "tenantId": "uuid",
  "locationId": "uuid",
  "name": "string",
  "description": "string",
  "capacity": "number",
  "ageRangeStart": "number (months)",
  "ageRangeEnd": "number (months)"
}
```

## Support

For tenant setup, JWT secret generation, or integration assistance, contact our development team with your:
- Organization name
- Expected usage volume
- Integration timeline
- Technical contact information