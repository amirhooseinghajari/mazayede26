const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { listItems, getItemById } = require('../helpers');

const router = express.Router();

router.get('/', (req, res) => {
  const items = listItems();
  const open = items.filter(i => i.isOpen);
  const closed = items.filter(i => !i.isOpen);
  res.render('home', { open, closed });
});

router.get('/items/new', requireAuth, (req, res) => {
  res.render('create-item', { error: null, values: {} });
});

router.post('/items/new', requireAuth, (req, res) => {
  const { title, description, image_url, starting_price, min_increment, duration_hours } = req.body;

  const startingPrice = parseInt(starting_price, 10);
  const minIncrement = parseInt(min_increment, 10) || 1000;
  const durationHours = parseFloat(duration_hours);

  if (!title || !description || !startingPrice || startingPrice <= 0 || !durationHours || durationHours <= 0) {
    return res.render('create-item', { error: 'لطفاً همه‌ی فیلدها را به‌درستی پر کنید.', values: req.body });
  }

  const endTime = new Date(Date.now() + durationHours * 3600 * 1000);
  const endTimeStr = endTime.toISOString().slice(0, 19).replace('T', ' ');

  const info = db.prepare(
    `INSERT INTO items (seller_id, title, description, image_url, starting_price, min_increment, end_time)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.session.user.id, title.trim(), description.trim(), (image_url || '').trim(), startingPrice, minIncrement, endTimeStr);

  res.redirect('/items/' + info.lastInsertRowid);
});

router.get('/items/:id', (req, res) => {
  const item = getItemById(req.params.id);
  if (!item) return res.status(404).render('not-found');

  const bids = db.prepare(
    `SELECT bids.amount, bids.created_at, users.name AS bidder_name
     FROM bids JOIN users ON users.id = bids.bidder_id
     WHERE item_id = ? ORDER BY bids.id DESC LIMIT 20`
  ).all(item.id);

  const seller = db.prepare('SELECT name FROM users WHERE id = ?').get(item.seller_id);

  res.render('item-detail', { item, bids, sellerName: seller.name, error: null });
});

router.get('/dashboard', requireAuth, (req, res) => {
  const myItems = db.prepare(`SELECT * FROM items WHERE seller_id = ? ORDER BY created_at DESC`)
    .all(req.session.user.id)
    .map(i => require('../helpers').enrichItem(i));

  const myBidItemIds = db.prepare(
    `SELECT DISTINCT item_id FROM bids WHERE bidder_id = ?`
  ).all(req.session.user.id).map(r => r.item_id);

  const myBids = myBidItemIds.map(id => getItemById(id));

  res.render('dashboard', { myItems, myBids });
});

module.exports = router;
