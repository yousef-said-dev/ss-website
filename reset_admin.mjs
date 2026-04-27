import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// No need for dotenv if we assume prisma handles it, but let's check
console.log('Attempting to connect to database...');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Hashing new password...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  console.log('Updating user "admin"...');
  const user = await prisma.users.update({
    where: { national_id: 'admin' },
    data: {
      password: hashedPassword,
      must_change_password: false,
    },
  });
  
  console.log('Admin password has been reset successfully!');
}

main()
  .catch((e) => {
    console.error('FAILED to reset password:');
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

