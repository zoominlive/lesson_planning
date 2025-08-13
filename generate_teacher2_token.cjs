const jwt = require('jsonwebtoken');

const payload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "teacher2_123",
  userFirstName: "Jennifer",
  userLastName: "Wilson",
  username: "teacher2@example.com",
  role: "Teacher",
  locations: ["Main Campus"],  // Changed to include Main Campus
  iat: 1754803034
};

const secret = 'dev-secret-key';
const token = jwt.sign(payload, secret);

console.log('New Teacher 2 token:', token);
