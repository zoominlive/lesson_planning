const jwt = require('jsonwebtoken');

// Generate a teacher token with room information for parent view testing
const teacherPayload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "teacher_parent_123",
  userFirstName: "Mary",
  userLastName: "Thompson", 
  username: "mary.thompson@example.com",
  role: "teacher",
  locations: ["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],  // Main Campus location ID
  locationNames: ["Main Campus"],
  roomId: "be3e6a76-17cb-4421-824a-272e24cf302f",  // Toddler 2 room ID
  roomName: "Toddler 2",
  iat: Math.floor(Date.now() / 1000)
};

const secret = 'dev-secret-key';
const teacherToken = jwt.sign(teacherPayload, secret);

console.log('Teacher token with room info:', teacherToken);
console.log('\nToken payload:', teacherPayload);