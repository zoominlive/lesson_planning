const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6InRlYWNoZXIyXzEyMyIsInVzZXJGaXJzdE5hbWUiOiJKZW5uaWZlciIsInVzZXJMYXN0TmFtZSI6IldpbHNvbiIsInVzZXJuYW1lIjoidGVhY2hlcjJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVGVhY2hlciIsImxvY2F0aW9ucyI6WyJNYWluIENhbXB1cyJdLCJpYXQiOjE3NTQ4MDMwMzR9.hjee-gbNbMhSHSTg7e42qawo5m9HaHIUBzCVkT1ZjS4";

const secret = 'dev-secret-key';

try {
  const decoded = jwt.verify(token, secret);
  console.log('Token is valid!');
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (err) {
  console.error('Token verification failed:', err.message);
}
