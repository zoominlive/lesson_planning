const jwt = require('jsonwebtoken');

const payload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "parent_123",
  userFirstName: "Sarah",
  userLastName: "Johnson",
  username: "parent@example.com",
  role: "parent",
  locations: ["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],  // Main Campus location ID
  childRoom: "be3e6a76-17cb-4421-824a-272e24cf302f",  // Toddler 2 room ID
  iat: Math.floor(Date.now() / 1000)
};

const secret = 'dev-secret-key';
const token = jwt.sign(payload, secret);

console.log('Parent token:', token);
console.log('\nToken payload:', payload);