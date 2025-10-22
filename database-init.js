const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/my-project-data.sqlite3.db');

const sql = `
  SELECT c.id, p.name, p.price, c.quantity
  FROM cart c
  JOIN products p ON p.id = c.product_id
  WHERE c.user_id = ?;
`;


db.serialize(() => {
  // --- Drop old tables if they exist
  db.run("DROP TABLE IF EXISTS order_items");
  db.run("DROP TABLE IF EXISTS orders");
  db.run("DROP TABLE IF EXISTS products");
  db.run("DROP TABLE IF EXISTS categories");
  db.run("DROP TABLE IF EXISTS users");
  db.run("DROP TABLE IF EXISTS cart");

  // --- USERS TABLE ---
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT,
      password TEXT,
      isAdmin INTEGER DEFAULT 0
    )
  `);

  // --- CATEGORIES TABLE ---
  db.run(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);

  // --- PRODUCTS TABLE ---
  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category_id INTEGER,
      price REAL,
      image TEXT,
      description TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // --- CART TABLE ---
  db.run(`
    CREATE TABLE cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // --- ORDERS TABLE ---
  db.run(`
    CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  full_name TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  card_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_price REAL,
  FOREIGN KEY (user_id) REFERENCES users(id)
  )
  `);

  // --- ORDER_ITEMS TABLE ---
  db.run(`
    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      subtotal REAL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Insert categories ( ids will be 1 and 2)
  db.run("INSERT INTO categories (name) VALUES ('Eyeglasses'), ('Sunglasses')", function(err) {
    if (err) return console.error('Insert categories error:', err.message);

    
    const eyeglassesId = 1;
    const sunglassesId = 2;

    // products: [name, category_id, price, image]
    const products = [
      ['Classic Black', eyeglassesId, 1500, 'img/glasses-1.avif'],
      ['Modern Frame', eyeglassesId, 1800, 'img/glasses-2.avif'],
      ['Grand Round', eyeglassesId, 900, 'img/glasses-3.avif'],
      ['Grand Square', eyeglassesId, 1000, 'img/glasses-4.avif'],
      ['Greyish Endo', eyeglassesId, 950, 'img/glasses-5.avif'],
      ['Curved Black', eyeglassesId, 1000, 'img/glasses-6.avif'],
      ['Rounded Black Oval', eyeglassesId, 1000, 'img/glasses-7.avif'],
      ['Glitz', eyeglassesId, 1000, 'img/glasses-8.avif'],
      ['Epic Gold', eyeglassesId, 1000, 'img/glasses-9.avif'],
      ['Pink Panther', eyeglassesId, 1000, 'img/glasses-10.avif'],
      ['Noizer', eyeglassesId, 1000, 'img/glasses-11.avif'],
      ['Catta', eyeglassesId, 1000, 'img/glasses-12.avif'],
      ['Sleek Black', eyeglassesId, 900, 'img/glasses-13.avif'],
      ['Classic Round', eyeglassesId, 1000, 'img/glasses-14.avif'],
      ['Modern Square', eyeglassesId, 1100, 'img/glasses-15.avif'],
      ['Chic Cat-Eye', eyeglassesId, 1200, 'img/glasses-16.avif'],
      ['Retro Aviator', eyeglassesId, 950, 'img/glasses-17.avif'],
      ['Sleek Sports', eyeglassesId, 1050, 'img/glasses-18.avif'],
      ['Elegant Gold', eyeglassesId, 950, 'img/glasses-19.avif'],
      ['Bold Red', eyeglassesId, 950, 'img/glasses-20.avif'],

      // sunglasses
      ['Aviator Classic', sunglassesId, 1200, 'img/sunglasses-4.avif'],
      ['Round Retro', sunglassesId, 1300, 'img/sunglasses-5.avif'],
      ['Trendy Square', sunglassesId, 1200, 'img/sunglass1.jpg'],
      ['Vintage Oval', sunglassesId, 1300, 'img/sunglass2.jpg'],
      ['Futuristic Shield', sunglassesId, 1200, 'img/sunglass3.jpg'],
      ['Classic Tortoise', sunglassesId, 1300, 'img/sunglasses-8.avif'],
      ['Orora', sunglassesId, 1200, 'img/sunglasses-9.avif'],
      ['Chic Round Metal', sunglassesId, 1300, 'img/sunglasses-10.avif'],
      ['Trendy Gradient', sunglassesId, 1200, 'img/sunglasses-11.avif'],
      ['Classic Tortoise', sunglassesId, 1300, 'img/sunglasses-12.avif'],
      ['Wayfarer Bold', sunglassesId, 1400, 'img/sunglasses-13.avif'],
      ['Sporty Wrap', sunglassesId, 1600, 'img/sunglasses-14.avif'],
      ['Elegant Cat-Eye', sunglassesId, 1700, 'img/sunglasses-15.avif'],
    ];

    const insert = db.prepare('INSERT INTO products (name, category_id, price, image) VALUES (?, ?, ?, ?)');
    for (const p of products) {
      insert.run(p, function(err) {
        if (err) console.warn('Insert product error:', err.message);
      });
    }
    insert.finalize(async() => {
      console.log('Database initialized with categories and products.');
      
    try {
      const bcrypt = require('bcrypt');
      const saltRounds = 12;
      const adminPassword = 'wdf#2025';
      const hashed = await bcrypt.hash(adminPassword, saltRounds);
      db.run("INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)", ['admin', hashed, 1], (err) => {
        if (err) console.warn('Insert admin user error:', err.message);
        // close DB 
        db.close((closeErr) => {
          if (closeErr) console.error('Error closing DB:', closeErr.message);
          else console.log('Database closed.');
        });
      });
    } catch (err) {
      console.error('Error creating admin user:', err);
      // Double close DB
      db.close();
    }
    });
  });
});