import { db } from './src/config/db';
import { hashPassword } from './src/modules/security/hash.service';

(async () => {
  try {
    // Clean up any test user
    await db.user.deleteMany({ where: { email: 'testauth@example.com' } });
    
    // Create test user
    const hashed = await hashPassword('TestPass@123');
    const user = await db.user.create({
      data: {
        name: 'Test Auth User',
        email: 'testauth@example.com',
        password: hashed,
        companyName: 'Test Corp'
      }
    });
    
    console.log('✅ Test user created successfully');
    console.log('Email: testauth@example.com');
    console.log('Password: TestPass@123');
    console.log('\nYou can now test the auth flow:');
    console.log('1. Open frontend at http://localhost:8080');
    console.log('2. Go to /login');
    console.log('3. Enter: testauth@example.com / TestPass@123');
    console.log('4. Should see dashboard');
  } catch (e: any) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
    process.exit(0);
  }
})();
