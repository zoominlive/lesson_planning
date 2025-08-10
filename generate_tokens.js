const jwt = require('jsonwebtoken');

const SECRET_KEY = 'dev-secret-key';

// Admin token
const adminPayload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "e5b7f0de-c868-4e40-a0bd-e15937cb3097",
  userFirstName: "Admin",
  userLastName: "User",
  username: "admin@example.com",
  role: "Admin",
  locations: ["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],
  iat: Math.floor(Date.now() / 1000)
};

// Teacher token
const teacherPayload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "teacher123",
  userFirstName: "Sarah",
  userLastName: "Johnson",
  username: "teacher@example.com",
  role: "Teacher",
  locations: ["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],
  iat: Math.floor(Date.now() / 1000)
};

// Director token
const directorPayload = {
  tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed",
  userId: "director123",
  userFirstName: "Michael",
  userLastName: "Brown",
  username: "director@example.com",
  role: "Director",
  locations: ["bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"],
  iat: Math.floor(Date.now() / 1000)
};

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

console.log('Admin Token:');
console.log(jwt.sign(adminPayload, SECRET_KEY));
console.log('\nTeacher Token:');
console.log(jwt.sign(teacherPayload, SECRET_KEY));
console.log('\nDirector Token:');
console.log(jwt.sign(directorPayload, SECRET_KEY));
console.log('\nAssistant Director Token:');
console.log(jwt.sign(assistantDirectorPayload, SECRET_KEY));
