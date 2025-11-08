const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'tests', 'screenshots');

fs.readdirSync(screenshotDir)
  .filter(f => f.endsWith('.png'))
  .forEach(f => {
    const filePath = path.join(screenshotDir, f);
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${f}`);
  });

console.log('All corrupted screenshots deleted!');
