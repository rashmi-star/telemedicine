import { initializeDatabase } from '../utils/initDb';
import { seedDatabase } from '../utils/seedDb';

const setupDatabase = async () => {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Seeding database...');
    await seedDatabase();
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase; 