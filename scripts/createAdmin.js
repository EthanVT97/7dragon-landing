import { createInitialAdmin } from '../src/utils/createInitialAdmin.js';

async function main() {
  try {
    const result = await createInitialAdmin(
      'admin@example.com',
      'admin123',
      'admin',
      'Super Admin'
    );
    console.log('Admin creation result:', result);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

main();
