const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getItemById } = require('../helpers');

const router = express.Router();

router.post('/items/:id/bid', requireAuth, (req, res) => {
  const item = getItemById(req.params.id);
  if (!item) return res.status(404).render('not-found');

  const amount = parseInt(req.body.amount, 10);
  const userId = req.session.user.id;

  let error = null;
  if (!item.isOpen) {
    error = 'مهلت این مزایده به پایان رسیده است.';
  } else if (item.seller_id === userId) {
    error = 'شما نمی‌توانید روی کالای خودتان پیشنهاد بدهید.';
  } else if (!amount || amount < item.minNextBid) {
    error = `پیشنهاد شما باید حداقل ${item.minNextBid.toLocaleString('fa-IR')} تومان باشد.`;
  }

  if (error) {
    const bids = db.prepare(
      `SELECT bids.amount, bids.created_at, users.name AS bidder_name
       FROM bids JOIN users ON users.id = bids.bidder_id
       WHERE item_id = ? ORDER BY bids.id DESC LIMIT 20`
    ).all(item.id);
    const seller = db.prepare('SELECT name FROM users WHERE id = ?').get(item.seller_id);
    return res.status(400).render('item-detail', { item, bids, sellerName: seller.name, error });
  }

  db.prepare('INSERT INTO bids (item_id, bidder_id, amount) VALUES (?, ?, ?)').run(item.id, userId, amount);
  res.redirect('/items/' + item.id);
});

module.exports = router;
