// 홈 화면 아이콘 만들기 — icons/icon-source.webp 로 아이콘 PNG 3개를 다시 만든다.
//   node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const CROP = { x: 37, y: 42, s: 1180 }; // 원본에서 남색 사각형 안쪽만 잘라낸 영역
const RADIUS_RATIO = 0.26;              // 원본 모서리 곡률
const NAVY = '#3C5C93';                 // 원본 배경색
const SAFE = 0.8;                       // maskable 안전 영역(갤럭시가 잘라도 남는 범위)

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent('<body style="margin:0"></body>');
  const src = 'data:image/webp;base64,' + fs.readFileSync(path.join(root, 'icons', 'icon-source.webp')).toString('base64');

  const out = await page.evaluate(async ([src, CROP, RADIUS_RATIO, NAVY, SAFE]) => {
    const img = new Image(); img.src = src; await img.decode();
    const cv = s => { const c = document.createElement('canvas'); c.width = c.height = s;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; return [c, x]; };

    // 단계적으로 절반씩 줄여 작은 크기에서도 선명하게
    const scaled = size => {
      let [c, x] = cv(CROP.s);
      x.drawImage(img, CROP.x, CROP.y, CROP.s, CROP.s, 0, 0, CROP.s, CROP.s);
      let cur = CROP.s;
      while (cur / 2 > size) { const n = Math.round(cur / 2); const [c2, x2] = cv(n);
        x2.drawImage(c, 0, 0, cur, cur, 0, 0, n, n); c = c2; cur = n; }
      const [f, fx] = cv(size);
      fx.drawImage(c, 0, 0, cur, cur, 0, 0, size, size);
      return f;
    };

    const rounded = (size, art, artSize, offset, bg) => {
      const [c, x] = cv(size);
      if (bg) { x.fillStyle = bg; x.fillRect(0, 0, size, size); }
      x.save();
      x.beginPath();
      x.roundRect(offset, offset, artSize, artSize, artSize * RADIUS_RATIO);
      x.clip();
      x.drawImage(art, offset, offset, artSize, artSize);
      x.restore();
      return c.toDataURL('image/png');
    };

    const inner = Math.round(512 * SAFE);
    const offset = Math.round((512 - inner) / 2);
    return {
      'icon-192.png': rounded(192, scaled(192), 192, 0, null),
      'icon-512.png': rounded(512, scaled(512), 512, 0, null),
      'icon-maskable-512.png': rounded(512, scaled(inner), inner, offset, NAVY)
    };
  }, [src, CROP, RADIUS_RATIO, NAVY, SAFE]);

  for (const [name, uri] of Object.entries(out)) {
    const file = path.join(root, 'icons', name);
    fs.writeFileSync(file, Buffer.from(uri.split(',')[1], 'base64'));
    console.log(name, fs.statSync(file).size, 'bytes');
  }
  await browser.close();
})();
