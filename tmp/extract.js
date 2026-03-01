const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('c:/Users/EmmanuelePrudenzano/Downloads/SuperNote/Supernote_InkGames/module/Nonogram/nonogram.js', 'utf8');
const regex = /eval\("(.+?)"\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
    let evalStr = match[1];
    // Unescape JS string
    let unescaped = eval('"' + evalStr + '"');

    // Get filename
    const filenameMatch = unescaped.match(/\/\/# sourceURL=webpack:\/\/Nonogram\/(.+?)\?/);
    const filename = filenameMatch ? filenameMatch[1] : 'unknown.js';

    console.log(`--- START --- ${filename}`);
    console.log(unescaped);
    console.log(`--- END --- ${filename}`);
}
