const jwt = require('jsonwebtoken');

const SECRET_KEY = 'dev-secret-key';

// Generate tokens with location names instead of UUIDs
const users = [
  {
    key: 'admin',
    payload: {
      tenantId: '7cb6c28d-164c-49fa-b461-dfc47a8a3fed',
      userId: 'e5b7f0de-c868-4e40-a0bd-e15937cb3097',
      userFirstName: 'Admin',
      userLastName: 'User',
      username: 'admin@example.com',
      role: 'Admin',
      locations: ['Main', 'Third']  // Using location names
    }
  },
  {
    key: 'teacher',
    payload: {
      tenantId: '7cb6c28d-164c-49fa-b461-dfc47a8a3fed',
      userId: 'teacher123',
      userFirstName: 'Sarah',
      userLastName: 'Johnson',
      username: 'teacher@example.com',
      role: 'Teacher',
      locations: ['Main', 'Third']  // Using location names
    }
  },
  {
    key: 'director',
    payload: {
      tenantId: '7cb6c28d-164c-49fa-b461-dfc47a8a3fed',
      userId: 'director123',
      userFirstName: 'Michael',
      userLastName: 'Brown',
      username: 'director@example.com',
      role: 'Director',
      locations: ['Main', 'Third']  // Using location names
    }
  },
  {
    key: 'assistant_director',
    payload: {
      tenantId: '7cb6c28d-164c-49fa-b461-dfc47a8a3fed',
      userId: 'assistant_director123',
      userFirstName: 'Emily',
      userLastName: 'Davis',
      username: 'assistant_director@example.com',
      role: 'assistant_director',
      locations: ['Main', 'Third']  // Using location names
    }
  },
  {
    key: 'superadmin',
    payload: {
      tenantId: '7cb6c28d-164c-49fa-b461-dfc47a8a3fed',
      userId: 'superadmin123',
      userFirstName: 'Super',
      userLastName: 'Admin',
      username: 'superadmin@example.com',
      role: 'SuperAdmin',
      locations: ['Main', 'Third']  // Using location names
    }
  }
];

console.log('// Generated tokens with location names instead of UUIDs:\n');

users.forEach(user => {
  const token = jwt.sign(user.payload, SECRET_KEY);
  console.log(`// ${user.key}:`);
  console.log(`// ${JSON.stringify(user.payload)}`);
  console.log(`${user.key}: "${token}",\n`);
});