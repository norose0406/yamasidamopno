document.documentElement.classList.add('js');

const header = document.querySelector('.site-header');
const toTop = document.querySelector('.to-top');
const toggle = document.querySelector('.nav-toggle');

// ヘッダーの背景・トップへ戻るボタン
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 40);
  toTop.classList.toggle('show', y > 600);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// スマホ用メニュー
const setNav = (open) => {
  document.body.classList.toggle('nav-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
};
toggle.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
document.querySelectorAll('.global-nav a').forEach((a) => a.addEventListener('click', () => setNav(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

// スクロールで表示
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// お問い合わせフォーム（入力チェックのみ。送信先は未設定）
const form = document.getElementById('contact-form');
const status = form.querySelector('.form-status');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach((el) => {
    const valid = el.type === 'checkbox' ? el.checked : el.checkValidity() && el.value.trim() !== '';
    el.classList.toggle('invalid', !valid);
    if (!valid) ok = false;
  });
  if (!ok) {
    status.className = 'form-status error';
    status.textContent = '未入力または正しくない項目があります。ご確認ください。';
    return;
  }
  status.className = 'form-status ok';
  // TODO: 送信先を設定したら、ここで送信処理を行う
  status.textContent = '入力内容に問題はありません。（送信機能は準備中です）';
});

document.getElementById('year').textContent = new Date().getFullYear();
