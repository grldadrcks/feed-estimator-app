const { createCanvas, loadImage } = require('canvas');
const fs   = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────
const SOURCE  = 'C:\\Users\\Mason\\Documents\\Mason Projects\\01 _ Round Badge.png';
const RES     = 'android/app/src/main/res';
const STORE   = 'assets';
const DEST    = 'C:\\Users\\Mason\\Documents\\Mason Projects';

// Badge sits in the top ~1730px of the 1680×1860 source (bottom strip = label text).
// We crop a centred square of 1640×1640 starting at (20, 30).
const CROP = { x: 20, y: 30, size: 1640 };

// Background colour sampled from the badge cream (#f0ebe0)
const BG_CREAM = '#f0ebe0';

// ── Helpers ───────────────────────────────────────────────────────────────────
function save(canvas, filepath) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`  ✓  ${path.relative(process.cwd(), filepath).padEnd(72)}(${kb} KB)`);
}

// Draw the cropped badge centred in a square canvas of `size` px.
// `pad` (0–1) shrinks the badge to leave breathing room for adaptive icons.
function drawBadge(ctx, badgeSrc, size, pad = 0) {
  const draw = size * (1 - pad * 2);
  const off  = size * pad;
  ctx.drawImage(
    badgeSrc,
    CROP.x, CROP.y, CROP.size, CROP.size,   // source crop
    off, off, draw, draw                      // destination
  );
}

// Standard square icon (rounded rect clip for launcher / Play Store)
function makeIcon(badge, size, cornerRatio = 0.18) {
  const c   = createCanvas(size, size);
  const ctx = c.getContext('2d');

  // Cream background (matches badge background so edges blend)
  ctx.fillStyle = BG_CREAM;
  ctx.fillRect(0, 0, size, size);

  // Rounded clip
  const r = size * cornerRatio;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.clip();

  drawBadge(ctx, badge, size, 0.02);
  return c;
}

// Adaptive foreground layer — badge in the safe zone (inner 66%)
function makeAdaptiveFg(badge, size) {
  const c   = createCanvas(size, size);
  const ctx = c.getContext('2d');
  // Transparent background — system provides its own shape
  drawBadge(ctx, badge, size, 0.17);
  return c;
}

// Adaptive background layer — solid cream
function makeAdaptiveBg(size) {
  const c   = createCanvas(size, size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = BG_CREAM;
  ctx.fillRect(0, 0, size, size);
  return c;
}

// Feature graphic 1024×500
function makeFeature(badge) {
  const W = 1024, H = 500;
  const c   = createCanvas(W, H);
  const ctx = c.getContext('2d');

  // Cream background
  ctx.fillStyle = BG_CREAM;
  ctx.fillRect(0, 0, W, H);

  // Subtle vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Badge on left
  const badgeSize = H * 0.88;
  const badgeX    = H * 0.06;
  const badgeY    = (H - badgeSize) / 2;
  ctx.drawImage(
    badge,
    CROP.x, CROP.y, CROP.size, CROP.size,
    badgeX, badgeY, badgeSize, badgeSize
  );

  // Text on right
  const tx = badgeX + badgeSize + W * 0.06;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';

  ctx.fillStyle = '#2c2010';
  ctx.font      = `bold ${Math.round(H * 0.155)}px serif`;
  ctx.fillText('Feed Estimator', tx, H * 0.34);

  ctx.fillStyle = '#5a3a1a';
  ctx.font      = `italic ${Math.round(H * 0.085)}px serif`;
  ctx.fillText('by M@SE', tx, H * 0.54);

  ctx.fillStyle = '#7a5a2a';
  ctx.font      = `${Math.round(H * 0.062)}px sans-serif`;
  ctx.fillText('Dairy farm feed order estimator', tx, H * 0.71);

  return c;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n🐄  Feed Estimator — Icon Generator (01 Round Badge)\n');
  console.log(`Loading source: ${SOURCE}\n`);
  const badge = await loadImage(SOURCE);

  const MIPMAP   = { 'mipmap-mdpi': 48,  'mipmap-hdpi': 72,  'mipmap-xhdpi': 96,  'mipmap-xxhdpi': 144,  'mipmap-xxxhdpi': 192  };
  const ADAPTIVE = { 'mipmap-mdpi': 108, 'mipmap-hdpi': 162, 'mipmap-xhdpi': 216, 'mipmap-xxhdpi': 324, 'mipmap-xxxhdpi': 432 };

  console.log('Android launcher icons:');
  for (const [dir, size] of Object.entries(MIPMAP)) {
    save(makeIcon(badge, size), `${RES}/${dir}/ic_launcher.png`);
    save(makeIcon(badge, size), `${RES}/${dir}/ic_launcher_round.png`);
  }

  console.log('\nAdaptive icon layers:');
  for (const [dir, size] of Object.entries(ADAPTIVE)) {
    save(makeAdaptiveFg(badge, size), `${RES}/${dir}/ic_launcher_foreground.png`);
    save(makeAdaptiveBg(size),        `${RES}/${dir}/ic_launcher_background.png`);
  }

  console.log('\nPlay Store assets:');
  save(makeIcon(badge, 512,  0),  `${STORE}/icon-512.png`);
  save(makeIcon(badge, 1024, 0),  `${STORE}/icon-1024.png`);
  save(makeFeature(badge),        `${STORE}/feature-graphic-1024x500.png`);

  console.log('\nCopying to Mason Projects:');
  for (const f of ['icon-512.png', 'icon-1024.png', 'feature-graphic-1024x500.png']) {
    fs.copyFileSync(`${STORE}/${f}`, `${DEST}\\FeedEstimator-${f}`);
    console.log(`  ✓  FeedEstimator-${f}`);
  }

  console.log('\n✅  Done.\n');
})();
