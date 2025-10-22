/*
MY NAME - MYMAIL@ju.se


Project Web Dev Fun - 2025

Admininistrator login: admin
Administrator password: $2b$12$p5.UuPb9Zh.siIc78Ie.Nu9eGx9d5OLT2pkecedig2P.6CdfL1ZUa
*/

//--- LOAD THE PACKAGES 
const express = require('express')
const {engine} = require('express-handlebars')


const session = require('express-session')
const SQLiteStore = require('connect-sqlite3')(session)
const bcrypt = require('bcrypt')


const fs = require('fs'); // to read JSON files
const path = require('path')
const sqlite3 = require('sqlite3').verbose();


// create/open DB after path is available
const db = new sqlite3.Database(path.join(__dirname, 'data', 'my-project-data.sqlite3.db'), (err) => {
  if (err) console.warn('Could not open database:', err.message);
  else console.log('Connected to SQLite database.');
})


// DEFINE VARIABLES AND CONSTANTS - EXPRESS
const app = express()
const PORT = process.env.PORT || 8080

app.use(express.urlencoded({ extended: true }))
app.use(express.json()) // parse JSON bodies

// MIDDLEWARES


app.use(
  session({
    store: new SQLiteStore({ db: 'session-db.db', dir: './' }),
    secret: 'mySuperSecretKey2025',
    resave: false,
    saveUninitialized: false
  })
)

app.use((req, res, next) => {
  res.locals.session = req.session
  next()
})



// serve static files from /public
app.use(express.static(path.join(__dirname, 'public')))

app.get('/ping', (req, res) => {
  res.send('pong')
})

// load site data once and expose to all views
const siteData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'))
app.use((req, res, next) => {
  res.locals.site = siteData
  res.locals.nav = siteData.nav
  res.locals.footer = siteData.footer
  next()
})

// HANDLEBARS

app.engine('handlebars', engine({
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  defaultLayout: 'main',
  helpers: {
    multiply: (a, b) => {
      const n1 = Number(a) || 0;
      const n2 = Number(b) || 0;
      return n1 * n2;
    }
  }
}))


app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// ROUTES    define the default '/' route

app.get('/', (req, res) => {
  console.log('GET / requested — session:', req.session && { isLoggedIn: req.session.isLoggedIn, userId: req.session.userId });
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'));

  const sqlEyeglasses = `
    SELECT * FROM products
    WHERE category_id = 1
    ORDER BY id ASC
  `;
  const sqlSunglasses = `
    SELECT * FROM products
    WHERE category_id = 2
    ORDER BY id ASC
  `;

  db.all(sqlEyeglasses, [], (err, eyeglasses) => {
    db.all(sqlSunglasses, [], (err2, sunglasses) => {
      res.render('pages/home', {
        layout: 'main',
        title: data.title,
        nav: data.nav,
        footer: data.footer,
        eyeglasses,
        sunglasses
      });
    });
  });
});



// LOGIN PAGE

app.get('/login', (req, res) => {
  res.render('pages/login', { layout: 'main', title: 'Login' })
})

// POST LOGIN DATA

const adminUsername = 'admin';
const adminPasswordHashed = '$2b$12$p5.UuPb9Zh.siIc78Ie.Nu9eGx9d5OLT2pkecedig2P.6CdfL1ZUa';

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("pages/login", {
      layout: "main",
      error: "Please fill in both fields."
    });
  }

  // CHECK IF ADMIN
  if (username === adminUsername) {
    const match = await bcrypt.compare(password, adminPasswordHashed);
    if (!match) {
      return res.render("pages/login", { layout: "main", error: "Invalid password." });
    }

    // ADMIN SESSION
    req.session.un = username;
    req.session.isLoggedIn = true;
    req.session.isAdmin = true;
    req.session.userId = 1; // admin user ID is 1

    return res.redirect("/");
  }

  // CHECK USERS IN DATABASE
  const sql = "SELECT * FROM users WHERE username = ?";
  db.get(sql, [username], async (err, user) => {
    if (err) {
      console.error(err);
      return res.render("pages/login", {
        layout: "main",
        error: "Database error. Try again later."
      });
    }

    // USER NOT FOUND ERROR
    if (!user) {
      return res.render("pages/login", { layout: "main", error: "Invalid username." });
    }

    // COMPARE PASSWORDS
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("pages/login", { layout: "main", error: "Invalid password." });
    }

    // LOG IN NORMAL USER
    req.session.un = user.username;
    req.session.isLoggedIn = true;
    req.session.isAdmin = false; 
    req.session.userId = user.id; // store user ID for later use

    res.redirect("/");
  });
});


//Register page

app.get("/register", (req, res) => {
  res.render("pages/register", { layout: "main", title: "Register" });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("pages/register", {
      layout: "main",
      error: "Please fill in both fields."
    });
  }

  try {
    // hash the password with strong salt rounds
    const hashedPassword = await bcrypt.hash(password, 14); // 14 rounds = very strong

    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.render("pages/register", {
              layout: "main",
              error: "That username already exists!"
            });
          } else {
            console.error(err);
            return res.render("pages/register", {
              layout: "main",
              error: "Database error. Try again later."
            });
          }
        }

        res.render("pages/register", {
          layout: "main",
          success: `User "${username}" registered successfully!`,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.render("pages/register", { layout: "main", error: "Unexpected error." });
  }
});

// --- ADMIN USER MANAGEMENT PAGE ---
app.get("/users", (req, res) => {
  // CHECK IF ADMIN
  if (!req.session.isLoggedIn || !req.session.isAdmin) {
    return res.status(403).render("pages/login", {
      layout: "main",
      error: "Access denied. Admins only."
    });
  }

  // GET USERS
  const sql = "SELECT id, username, email, password FROM users ORDER BY id ASC";
  db.all(sql, [], (err, users) => {
    if (err) {
      console.error(err);
      return res.render("pages/users", {
        layout: "main",
        error: "Error retrieving users."
      });
    }

    // RENDER PAGE
    res.render("pages/users", {
      layout: "main",
      title: "User Management",
      users
    });
  });
});

// LOGOUT

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

//Glasses page

app.get('/glasses', (req, res) => {
  const sql = `
    SELECT products.*, categories.name AS categoryName
    FROM products
    INNER JOIN categories ON products.category_id = categories.id
    WHERE categories.name = 'Eyeglasses'
    ORDER BY products.id ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) console.error(err);
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'));
    res.render('pages/glasses', {
      layout: 'main',
      title: 'Eyeglasses | LUMILUXE',
      nav: data.nav,
      footer: data.footer,
      eyeglasses: rows
    });
  });
});



//Sunglasses page

app.get('/sunglasses', (req, res) => {
  const sql = `
    SELECT products.*, categories.name AS categoryName
    FROM products
    INNER JOIN categories ON products.category_id = categories.id
    WHERE categories.name = 'Sunglasses'
    ORDER BY products.id ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) console.error(err);
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'));
    res.render('pages/sunglasses', {
      layout: 'main',
      title: 'Sunglasses | LUMILUXE',
      nav: data.nav,
      footer: data.footer,
      sunglasses: rows
    });
  });
});


// CONTACT PAGE

app.get('/contact', (req, res) => {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'));
  } catch (err) {
    console.warn('Could not read data/content.json, using defaults:', err.message);
    data = { title: 'Contact', nav: [], footer: {} };
  }
  res.render('pages/contact', {
    layout: 'main',
    title: data.title || 'Contact',
    nav: data.nav || [],
    footer: data.footer || {}
  });
});




//CREATE

app.post("/cart/add", (req, res) => {
  console.log('HANDLER: POST /cart/add called — body:', req.body, 'session:', req.session && { isLoggedIn: req.session.isLoggedIn, userId: req.session.userId });
  if (!req.session || !req.session.isLoggedIn) {
    console.log('POST /cart/add blocked: not logged in');
    return res.status(403).send("Login first.");
  }

  const { productId } = req.body;
  const userId = req.session.userId;
  if (!productId) {
    console.log('POST /cart/add missing productId in body');
    return res.status(400).send("Missing productId");
  }

  db.get("SELECT * FROM cart WHERE user_id=? AND product_id=?", [userId, productId], (err, row) => {
    if (err) {
      console.error('DB ERROR (cart select):', err);
      return res.status(500).send('Database error');
    }
    if (row) {
      db.run("UPDATE cart SET quantity = quantity + 1 WHERE id = ?", [row.id], function(e) {
        if (e) console.error('DB ERROR (cart update):', e);
        return res.redirect("/cart");
      });
    } else {
      db.run("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)", [userId, productId], function(e) {
        if (e) {
          console.error('DB ERROR (cart insert):', e);
          return res.status(500).send('Database error');
        }
        return res.redirect("/cart");
      });
    }
  });
});


//READ

app.get("/cart", (req, res) => {
  if (!req.session.isLoggedIn) return res.redirect("/login");
  const userId = req.session.userId;
  const sql = `
    SELECT c.id, p.name, p.price, c.quantity
    FROM cart c
    JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?;
  `;
  db.all(sql, [userId], (err, items) => {
    if (err) {
      console.error('DB error (cart select):', err);
      return res.render("pages/cart", { layout: "main", items: [] });
    }
    res.render("pages/cart", { layout: "main", items });
  });
});


//UPDATE

app.post("/cart/update/:id", (req, res) => {
  const { quantity } = req.body;
  db.run("UPDATE cart SET quantity=? WHERE id=?", [quantity, req.params.id], () => {
    res.redirect("/cart");
  });
});

//DELETE

app.get("/cart/delete/:id", (req, res) => {
  db.run("DELETE FROM cart WHERE id=?", [req.params.id], () => res.redirect("/cart"));
});

// PAYMENT

// GET CHECKOUT
app.get("/checkout", (req, res) => {
  if (!req.session.isLoggedIn) return res.redirect("/login");
  res.render("pages/checkout", { layout: "main" });
});

// POST PAYMENT DATA

app.post("/checkout", (req, res) => {
  const { fullName, address, city, postal, cardNumber } = req.body;
  const userId = req.session.userId;

  const totalSql = `
    SELECT SUM(p.price * c.quantity) AS total
    FROM cart c JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?;
  `;
  db.get(totalSql, [userId], (err, result) => {
    const total = result?.total || 0;

    db.run(
      `INSERT INTO orders (user_id, total_price, full_name, address, city, postal_code, card_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, total, fullName, address, city, postal, cardNumber],
      (err2) => {
        if (err2) console.error(err2);
        db.run("DELETE FROM cart WHERE user_id=?", [userId]); // <- also singular
        res.render("pages/checkout-success", { layout: "main", total });
      }
    );
  });
});


//ORDER MANAGEMENT ADMIN 

app.get("/orders", (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send("Admins only.");
  db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, orders) => {
    res.render("pages/orders", { layout: "main", orders });
  });
});

app.get("/orders/delete/:id", (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send("Admins only.");
  db.run("DELETE FROM orders WHERE id=?", [req.params.id], () => res.redirect("/orders"));
});


// LOCALHOST

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

