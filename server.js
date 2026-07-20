require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const bidRoutes = require('./routes/bids');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// نکته: از فروشگاه پیش‌فرض (حافظه‌ی موقت) برای نشست‌ها استفاده شده که برای
// شروع کار و محیط تک‌سروری کافی است. برای استقرار واقعی با ترافیک بالا یا
// چند نمونه‌ی سرور، یک store پایدار مثل connect-sqlite3 یا Redis جایگزین کنید.
app.use(session({
  secret: process.env.SESSION_SECRET || 'یک-رمز-محرمانه-را-اینجا-در-فایل-env-قرار-بده',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 } // ۳۰ روز
}));

app.use(attachUser);

app.use('/', authRoutes);
app.use('/', itemRoutes);
app.use('/', bidRoutes);

app.use((req, res) => res.status(404).render('not-found'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`سایت مزایده روی پورت ${PORT} در حال اجراست`));
