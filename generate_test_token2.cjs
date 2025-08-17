const jwt = require('jsonwebtoken');

const JWT_SECRET = 'dev-secret-key';

const token = jwt.sign(
  {
    sub: 'c9a4f0e4-cd31-44e3-9423-e4ccd91a03dc',
    userId: 'c9a4f0e4-cd31-44e3-9423-e4ccd91a03dc',
    userFirstName: 'Test',
    userLastName: 'Teacher',
    username: 'teacher2',
    role: 'teacher',
    tenantId: '7cb6c28d-164c-49fa-b461-dfc47a8a3fed',
    locations: ['c983168a-8400-41ab-8149-1734b7f112c8'],
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Token:', token);
