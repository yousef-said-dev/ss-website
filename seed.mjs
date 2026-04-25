import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.users.findUnique({
    where: { national_id: 'admin' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.users.create({
      data: {
        national_id: 'admin',
        name: 'مدير النظام',
        password: hashedPassword,
        role: 'admin',
        must_change_password: false,
      },
    });
    console.log('Admin seeded successfully! Login with admin / admin123');
  } else {
    console.log('Admin already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
