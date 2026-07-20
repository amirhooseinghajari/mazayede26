function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

// Makes the logged-in user (or null) available in every view without
// repeating this in each route.
function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

module.exports = { requireAuth, attachUser };
