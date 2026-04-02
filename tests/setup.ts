import 'dotenv/config';

// Use a separate test database to avoid polluting dev data
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
