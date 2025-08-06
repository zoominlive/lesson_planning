# API Testing Guide

## Postman Setup

### 1. Import Collection and Environment

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `Lesson_Planning_API.postman_collection.json`

2. **Import Environment:**
   - Click "Import" button
   - Select `Lesson_Planning_API.postman_environment.json`
   - Set as active environment

### 2. Configure Environment Variables

Update the following variables in your environment:

```json
{
  "base_url": "http://localhost:5000",
  "jwt_token": "your-actual-jwt-token-here",
  "tenant_id": "7cb6c28d-164c-49fa-b461-dfc47a8a3fed"
}
```

### 3. Generate JWT Token

Use the following payload structure to generate a valid JWT token:

```javascript
const jwt = require('jsonwebtoken');

const payload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "12345678-90ab-cdef-1234-567890abcdef",
  userFirstName: "Jane",
  userLastName: "Doe", 
  username: "jane.doe",
  role: "Admin", // Use "Admin" to test settings endpoints
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4) // 4 hours
};

const secret = "your-jwt-secret-here";
const token = jwt.sign(payload, secret);
```

## Testing Workflow

### 1. Authentication Test
```bash
GET /api/user
```
- Verify token is working
- Confirm user role for settings access

### 2. Core Entities Testing

**Test Order (dependencies):**
1. Create Milestone
2. Create Material
3. Create Activity
4. Create Lesson Plan
5. Create Scheduled Activity

**Example:**
```bash
# 1. Create Milestone
POST /api/milestones
{
  "title": "Can stack blocks",
  "description": "Child can stack 3 blocks independently",
  "domain": "Physical",
  "ageRangeStart": 18,
  "ageRangeEnd": 30
}

# 2. Use returned ID for updates
PUT /api/milestones/{{milestone_id}}
```

### 3. Settings Testing (Admin Only)

**Prerequisites:**
- JWT token must have `"role": "Admin"`
- Test in this order due to dependencies:

```bash
# 1. Create Location first
POST /api/locations
{
  "name": "Main Building",
  "description": "Primary facility",
  "address": "123 Learning Lane",
  "capacity": 150
}

# 2. Create Room (requires location_id)
POST /api/rooms
{
  "name": "Rainbow Room",
  "locationId": "{{location_id}}",
  "capacity": 20,
  "ageRangeStart": 24,
  "ageRangeEnd": 48
}

# 3. Create Category
POST /api/categories
{
  "name": "STEM Activities",
  "type": "activity",
  "color": "#3b82f6"
}

# 4. Create Age Group
POST /api/age-groups
{
  "name": "Toddlers",
  "ageRangeStart": 18,
  "ageRangeEnd": 36
}
```

## Common Test Scenarios

### 1. Full CRUD Testing

For each entity, test:
1. **Create** - POST with valid data
2. **Read** - GET to retrieve created item
3. **Update** - PUT with partial data
4. **Delete** - DELETE to remove item
5. **List** - GET to verify removal

### 2. Validation Testing

Test invalid data scenarios:
- Missing required fields
- Invalid data types
- Out-of-range values
- Duplicate names (where applicable)

### 3. Tenant Isolation Testing

With different tenant IDs:
- Verify data isolation between tenants
- Confirm no cross-tenant data access
- Test with invalid tenant IDs

### 4. Role-Based Access Testing

**Teacher Role:**
- Should access milestones, materials, activities, lesson plans
- Should NOT access settings endpoints

**Admin Role:**
- Should access all teacher endpoints
- Should access settings endpoints
- Should see settings gear icon in UI

## Response Validation

Each request includes automatic tests:

```javascript
// Status code validation
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Response structure validation
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('tenantId');
});

// Auto-populate environment variables
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("created_item_id", jsonData.id);
}
```

## Error Testing

### Expected Error Responses

**401 Unauthorized:**
- Missing or invalid JWT token
- Expired token
- Invalid signature

**403 Forbidden:**
- Insufficient role permissions
- Wrong tenant access

**400 Bad Request:**
- Invalid JSON format
- Missing required fields
- Validation errors

**404 Not Found:**
- Item doesn't exist
- Wrong tenant context

**500 Server Error:**
- Database connection issues
- Unexpected server errors

## Performance Testing

### Load Testing Recommendations

1. **Concurrent Users:** Test with 10-50 concurrent requests
2. **Data Volume:** Test with 100+ records per entity
3. **Response Time:** Target < 200ms for GET requests
4. **Memory Usage:** Monitor for memory leaks during extended testing

### Monitoring Endpoints

```bash
# Health check
GET /api/user

# Performance test endpoints
GET /api/activities (should handle 100+ items)
GET /api/milestones (should handle 50+ items)
```

## Troubleshooting

### Common Issues

**Authentication Failures:**
1. Verify JWT token format and signature
2. Check token expiration
3. Confirm tenant ID matches database
4. Validate required payload fields

**CORS Issues:**
- Ensure proper origin headers
- Check preflight request handling

**Database Errors:**
- Verify tenant isolation
- Check foreign key constraints
- Confirm UUID format validity

### Debug Tools

**Postman Console:**
- View detailed request/response logs
- Check environment variable values
- Monitor test execution results

**Network Tab:**
- Inspect actual HTTP requests
- Verify headers and payloads
- Check response timing

**Server Logs:**
- Monitor Express.js console output
- Check database query logs
- Review error stack traces