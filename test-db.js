const prisma = require("./src/config/prisma");

async function testDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful!");
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();