const db = require('./db');

// Returns the item enriched with current price, bid count, and status.
function enrichItem(item) {
  const top = db.prepare(
    `SELECT bids.amount, bids.created_at, users.name AS bidder_name
     FROM bids JOIN users ON users.id = bids.bidder_id
     WHERE item_id = ? ORDER BY amount DESC, bids.id DESC LIMIT 1`
  ).get(item.id);

  const bidCount = db.prepare(`SELECT COUNT(*) AS c FROM bids WHERE item_id = ?`).get(item.id).c;

  const currentPrice = top ? top.amount : item.starting_price;
  const endsAt = new Date(item.end_time + 'Z');
  const isOpen = endsAt.getTime() > Date.now();

  return {
    ...item,
    currentPrice,
    minNextBid: top ? currentPrice + item.min_increment : item.starting_price,
    bidCount,
    topBidderName: top ? top.bidder_name : null,
    isOpen,
    endsAtISO: endsAt.toISOString(),
  };
}

function getItemById(id) {
  const item = db.prepare(`SELECT * FROM items WHERE id = ?`).get(id);
  if (!item) return null;
  return enrichItem(item);
}

function listItems() {
  const items = db.prepare(`SELECT * FROM items ORDER BY created_at DESC`).all();
  return items.map(enrichItem);
}

module.exports = { enrichItem, getItemById, listItems };
