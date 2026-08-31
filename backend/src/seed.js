// Seed script - runs database initialization with demo data
import { initializeDatabase } from './models/database.js';

async function main() {
  console.log('Initializing database and seeding demo data...');
  await initializeDatabase();
  console.log('Done!');
  process.exit(0);
}

main();
