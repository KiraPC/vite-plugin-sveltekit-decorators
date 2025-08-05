import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🔨 Building plugin...');

// Create dist directory
mkdirSync('dist', { recursive: true });

// Copy JavaScript files
const jsFiles = ['index.js', 'transformer.js', 'config.js', 'parser.js', 'utils.js'];
let copiedFiles = 0;

jsFiles.forEach(file => {
  const srcPath = join('src', file);
  const distPath = join('dist', file);
  
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, distPath);
    console.log(`✅ Copied ${file}`);
    copiedFiles++;
  } else {
    console.log(`⚠️  Skipped ${file} (not found)`);
  }
});

// Copy type definitions
const typesPath = join('src', 'types.d.ts');
if (existsSync(typesPath)) {
  copyFileSync(typesPath, join('dist', 'types.d.ts'));
  console.log('✅ Copied types.d.ts');
  copiedFiles++;
} else {
  console.log('⚠️  types.d.ts not found');
}

console.log(`🎉 Build complete! Copied ${copiedFiles} files.`);
