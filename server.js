/*
MY NAME - MYMAIL@ju.se


Project Web Dev Fun - 2025

Admininistrator login: admin
Administrator password: $2b$12$p5.UuPb9Zh.siIc78Ie.Nu9eGx9d5OLT2pkecedig2P.6CdfL1ZUa
*/

//--- LOAD THE PACKAGES 
const express = require('express')
const {engine} = require('express-handlebars')
const bodyParser = require('body-parser')
//const bcrypt = require('bcrypt')
//const session = require('express-session')
const sqlite3=require('sqlite3') // load the sqlite3 package
//const connectSqlite3 = require('connect-sqlite3')
const fs = require('fs'); // to read JSON files
const path = require('path')

// DEFINE VARIABLES AND CONSTANTS - EXPRESS
const app = express()
const PORT = process.env.PORT || 8080

// serve static files from /public
app.use(express.static(path.join(__dirname, 'public')))

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
  defaultLayout: 'main'
}))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))


// ROUTES    define the default '/' route
app.get('/', function (req, res) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'));
  res.render('pages/home', {
    layout: 'main',
    title: data.title,
    header: data.header,
    footer: data.footer,
    eyeglasses: data.eyeglasses,
    sunglasses: data.sunglasses
  })
});

//Glasses page

app.get('/glasses', (req, res) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'));
  res.render('pages/glasses', {
    layout: 'main',
    title: 'Eyeglasses | LUMILUXE',
    nav: data.nav,
    products: data.products,
    eyeglasses: data.eyeglasses,
    footer: data.footer
  });
});


//Sunglasses page

app.get('/sunglasses', (req, res) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'));
  res.render('pages/sunglasses', {
    layout: 'main',
    title: 'Sunglasses',
    siteName: 'LUMILUXE',
    nav: data.nav,
    footer: data.footer,
    sunglasses: data.sunglasses
  });
});

// contact page

app.get('/contact', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./data/site.json')); // for example
  res.render('pages/contact', data);
});


// LOCALHOST

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

