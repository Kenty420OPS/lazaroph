const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const webappDir = path.join(__dirname, 'src', 'main', 'webapp');
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

console.log('Building LAZAROPH for Vercel deployment...');

// Copy webapp to dist/
copyDir(webappDir, distDir);
console.log('-> Copied webapp to dist/');

// Copy webapp to public/
copyDir(webappDir, publicDir);
console.log('-> Copied webapp to public/');

// Copy index.html to root directory
fs.copyFileSync(path.join(webappDir, 'index.html'), path.join(__dirname, 'index.html'));
console.log('-> Copied index.html to root/');

// Copy css, js, images to root for universal root fallback
copyDir(path.join(webappDir, 'css'), path.join(__dirname, 'css'));
copyDir(path.join(webappDir, 'js'), path.join(__dirname, 'js'));
copyDir(path.join(webappDir, 'images'), path.join(__dirname, 'images'));
console.log('-> Copied css, js, images to root/');

console.log('Build complete! All routes and directories synchronized for Vercel.');
