const jwt = require('jsonwebtoken');

const SECRET_KEY = 'dev-secret-key';

// Assistant Director token
const assistantDirectorPayload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "assistant_director123",
  userFirstName: "Emily",
  userLastName: "Davis",
  username: "assistant_director@example.com",
  role: "assistant_director",
  locations: ["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],
  iat: Math.floor(Date.now() / 1000)
};

console.log('Assistant Director Token:');
console.log(jwt.sign(assistantDirectorPayload, SECRET_KEY));