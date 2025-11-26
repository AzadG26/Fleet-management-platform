import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances in development
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query']
    });
  }
  prisma = global.__prisma;
}

export { prisma };
export default prisma;