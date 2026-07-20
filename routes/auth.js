const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { error: null, values: {} });
});

router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;

  if (!name || !email || !password) {
    return res.render('register', { error: 'همه‌ی فیلدها الزامی هستند.', values: req.body });
  }
  if (password.length < 6) {
    return res.render('register', { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.', values: req.body });
  }
  if (password !== password2) {
    return res.render('register', { error: 'رمز عبور و تکرار آن یکسان نیستند.', values: req.body });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    return res.render('register', { error: 'این ایمیل قبلاً ثبت‌نام کرده است.', values: req.body });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name.trim(), email.trim().toLowerCase(), hash);

  req.session.user = { id: info.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase() };
  res.redirect('/');
});

router.get('/login', (req, res) => {
  res.render('login', { error: null, values: {} });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.render('login', { error: 'ایمیل یا رمز عبور اشتباه است.', values: req.body });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  const dest = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(dest);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
