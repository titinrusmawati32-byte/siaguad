/**
 * SiAGU — Frontend Bundler untuk GitHub Pages
 * Menggabungkan seluruh komponen modular (src/views/*.html) menjadi 1 file index.html mandiri untuk GitHub Pages.
 * 
 * Cara Menjalankan:
 * node build.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const viewsDir = path.join(srcDir, 'views');
const indexTemplatePath = path.join(viewsDir, 'Index.html');
const outputPath = path.join(__dirname, 'index.html');

console.log('🚀 Memulai proses build Frontend untuk GitHub Pages...');

if (!fs.existsSync(indexTemplatePath)) {
  console.error('❌ Template Index.html tidak ditemukan di:', indexTemplatePath);
  process.exit(1);
}

let indexContent = fs.readFileSync(indexTemplatePath, 'utf8');

// Regex untuk mencocokkan pola include Google Apps Script: <?!= include('views/XYZ'); ?> atau <?!= include('XYZ'); ?>
const includeRegex = /<\?!\s*include\(['"]([^'"]+)['"]\);\s*\?>/g;

indexContent = indexContent.replace(includeRegex, (match, componentPath) => {
  // Bersihkan prefix 'views/' jika ada
  const cleanName = componentPath.replace(/^views\//, '');
  const targetFile = path.join(viewsDir, cleanName + (cleanName.endsWith('.html') ? '' : '.html'));

  if (fs.existsSync(targetFile)) {
    console.log(`  ✓ Menggabungkan komponen: ${cleanName}`);
    return `\n<!-- START COMPONENT: ${cleanName} -->\n` + 
           fs.readFileSync(targetFile, 'utf8') + 
           `\n<!-- END COMPONENT: ${cleanName} -->\n`;
  } else {
    console.warn(`  ⚠️ Komponen tidak ditemukan: ${targetFile}`);
    return `<!-- Missing component: ${componentPath} -->`;
  }
});

// Tulis file hasil ke index.html di root
fs.writeFileSync(outputPath, indexContent, 'utf8');

console.log('🎉 Selesai! File "index.html" siap di-hosting ke GitHub Pages.');
console.log('📁 Lokasi file:', outputPath);
