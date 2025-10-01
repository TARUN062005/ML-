// server/utils/dbConnector.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'] // Optional: logs Prisma queries and info
});

const ConnectDb = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1); // Stop the server if DB fails
  }
};

// Gracefully disconnect Prisma on app termination
const DisconnectDb = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (err) {
    console.error('Error during database disconnect:', err);
  }
};

process.on('SIGINT', async () => {
  await DisconnectDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await DisconnectDb();
  process.exit(0);
});

module.exports = { prisma, ConnectDb, DisconnectDb };
