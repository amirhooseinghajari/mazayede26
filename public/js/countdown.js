// Live countdown for auction end times. Works on both the home page
// (lot-status badges) and the item detail page (.countdown block).
function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = n => String(n).padStart(2, '0');
  if (h > 0) return `${h} ساعت ${pad(m)} دقیقه مانده`;
  if (m > 0) return `${m} دقیقه ${pad(s)} ثانیه مانده`;
  return `${s} ثانیه مانده`;
}

function tick() {
  const now = Date.now();

  document.querySelectorAll('[data-countdown]').forEach(el => {
    const end = new Date(el.dataset.countdown).getTime();
    const remaining = formatRemaining(end - now);
    if (remaining) {
      el.textContent = remaining;
    } else if (el.textContent !== 'پایان‌یافته') {
      el.textContent = 'پایان‌یافته';
      el.classList.remove('open');
      el.classList.add('closed');
    }
  });

  document.querySelectorAll('[data-countdown-text]').forEach(el => {
    const end = new Date(el.dataset.countdownText).getTime();
    const remaining = formatRemaining(end - now);
    if (remaining) {
      el.textContent = remaining;
    } else if (!el.classList.contains('ended')) {
      el.textContent = 'زمان به پایان رسید — صفحه را رفرش کنید';
      el.classList.add('ended');
    }
  });
}

tick();
setInterval(tick, 1000);
