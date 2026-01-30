import db, { initializeDatabase } from './db';
import { hashPassword } from './utils/crypto';

async function seed() {
  console.log('Starting database seed...\n');

  // Initialize schema (now async)
  await initializeDatabase();

  // Seed users
  console.log('Seeding users...');
  const users = [
    { email: 'admin@lms.test', password: 'Admin@123', full_name: 'Admin User', role: 'ADMIN' },
    { email: 'lib@lms.test', password: 'Lib@12345', full_name: 'Librarian Jane', role: 'LIBRARIAN' },
    { email: 'mem@lms.test', password: 'Mem@12345', full_name: 'Member John', role: 'MEMBER' },
  ];

  for (const user of users) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    if (!existing) {
      const password_hash = await hashPassword(user.password);
      db.prepare(`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES (?, ?, ?, ?)
      `).run(user.email, password_hash, user.full_name, user.role);
      console.log(`  Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`  User exists: ${user.email}`);
    }
  }

  // Seed books
  console.log('\nSeeding books...');
  const books = [
    {
      isbn: '978-0-13-468599-1',
      title: 'The Pragmatic Programmer',
      author: 'David Thomas, Andrew Hunt',
      description: 'Your journey to mastery. A guide to pragmatic programming and software craftsmanship.',
      categories: 'Programming, Software Engineering, Best Practices',
      total_copies: 3,
    },
    {
      isbn: '978-0-596-51774-8',
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      description: 'Unearthing the excellence in JavaScript. A deep dive into the best parts of the language.',
      categories: 'Programming, JavaScript, Web Development',
      total_copies: 5,
    },
    {
      isbn: '978-1-59327-584-6',
      title: 'The Linux Command Line',
      author: 'William Shotts',
      description: 'A complete introduction to Linux command line, from basic navigation to shell scripting.',
      categories: 'Linux, System Administration, Command Line',
      total_copies: 2,
    },
    {
      isbn: '978-0-13-235088-4',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      description: 'A handbook of agile software craftsmanship. Learn to write clean, maintainable code.',
      categories: 'Programming, Software Engineering, Best Practices',
      total_copies: 4,
    },
    {
      isbn: '978-0-201-63361-0',
      title: 'Design Patterns',
      author: 'Gang of Four',
      description: 'Elements of Reusable Object-Oriented Software. The classic book on design patterns.',
      categories: 'Programming, Software Engineering, Design Patterns',
      total_copies: 2,
    },
    {
      isbn: '978-1-491-95038-8',
      title: 'Learning Python',
      author: 'Mark Lutz',
      description: 'Powerful Object-Oriented Programming. A comprehensive guide to Python programming.',
      categories: 'Programming, Python, Web Development',
      total_copies: 6,
    },
  ];

  for (const book of books) {
    const existing = db.prepare('SELECT id FROM books WHERE isbn = ?').get(book.isbn);
    if (!existing) {
      db.prepare(`
        INSERT INTO books (isbn, title, author, description, categories, total_copies, available_copies)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(book.isbn, book.title, book.author, book.description, book.categories, book.total_copies, book.total_copies);
      console.log(`  Created book: ${book.title}`);
    } else {
      console.log(`  Book exists: ${book.title}`);
    }
  }

  console.log('\n✓ Seed completed successfully!\n');
  
  // Print summary
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  const bookCount = (db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number }).count;
  
  console.log('Summary:');
  console.log(`  Users: ${userCount}`);
  console.log(`  Books: ${bookCount}`);
  console.log('\nDefault credentials:');
  console.log('  admin@lms.test / Admin@123  (ADMIN)');
  console.log('  lib@lms.test   / Lib@12345  (LIBRARIAN)');
  console.log('  mem@lms.test   / Mem@12345  (MEMBER)');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
