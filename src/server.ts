import 'dotenv/config';
import app from './app';
import prisma from './config/db';

const PORT = process.env.PORT ?? 3000;

async function main() {
  // Verify DB connection on startup
  await prisma.$connect();
  console.log('✅ Database connected successfully.');

  app.listen(PORT, () => {
    console.log(`🚀 Finance API running on http://localhost:${PORT}`);
    console.log(`📚 Swagger docs at http://localhost:${PORT}/api/docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
