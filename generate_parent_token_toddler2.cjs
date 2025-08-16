const jwt = require('jsonwebtoken');

// Parent token payload for Main Campus - Toddler 2 room
const parentPayload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "parent_toddler2_123",
  userFirstName: "Lisa",
  userLastName: "Johnson", 
  username: "lisa.johnson@parent.com",
  role: "parent",
  locations: ["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"], // Main Campus location ID
  locationNames: ["Main Campus"],
  roomId: "be3e6a76-17cb-4421-824a-272e24cf302f", // Toddler 2 room ID
  roomName: "Toddler 2",
  childRoom: "be3e6a76-17cb-4421-824a-272e24cf302f", // Alternative field for room access
  iat: Math.floor(Date.now() / 1000)
};

// Sign with the same secret used by other test tokens
const secret = 'dev-secret-key';
const token = jwt.sign(parentPayload, secret);

console.log('Parent Token (Toddler 2):');
console.log(token);
console.log('\nDecoded payload:');
console.log(JSON.stringify(parentPayload, null, 2));