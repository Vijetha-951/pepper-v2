const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('\n' + '='.repeat(70));
console.log('🔍 PEPPER Enhanced Tests - Setup Verification');
console.log('='.repeat(70) + '\n');

let allGood = true;

const checks = [
  {
    name: 'Node.js',
    check: () => {
      console.log(`✅ Node.js v${process.version}`);
      return true;
    }
  },
  {
    name: 'Jest Configuration',
    check: () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      if (fs.existsSync(configPath)) {
        console.log(`✅ jest.config.js found`);
        return true;
      } else {
        console.log(`❌ jest.config.js not found`);
        return false;
      }
    }
  },
  {
    name: 'Test File',
    check: () => {
      const testPath = path.join(__dirname, 'tests', 'pepper-enhanced-tests.test.js');
      if (fs.existsSync(testPath)) {
        console.log(`✅ pepper-enhanced-tests.test.js found`);
        return true;
      } else {
        console.log(`❌ pepper-enhanced-tests.test.js not found`);
        return false;
      }
    }
  },
  {
    name: 'Dependencies',
    check: () => {
      const nodeModules = path.join(__dirname, 'node_modules');
      if (fs.existsSync(nodeModules)) {
        console.log(`✅ node_modules exists`);
        return true;
      } else {
        console.log(`❌ node_modules not found - run: npm install`);
        return false;
      }
    }
  },
  {
    name: 'Screenshots Directory',
    check: () => {
      const screenshotDir = path.join(__dirname, 'tests', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      console.log(`✅ Screenshots directory ready`);
      return true;
    }
  },
  {
    name: 'Frontend Server',
    check: () => {
      return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
          console.log(`✅ Frontend server running on port 3000`);
          resolve(true);
        }).on('error', () => {
          console.log(`⚠️  Frontend server not running on port 3000`);
          console.log(`   Start with: cd frontend && npm start`);
          resolve(false);
        });
        req.setTimeout(2000);
      });
    }
  },
  {
    name: 'Backend Server',
    check: () => {
      return new Promise((resolve) => {
        const req = http.get('http://localhost:5000', (res) => {
          console.log(`✅ Backend server running on port 5000`);
          resolve(true);
        }).on('error', () => {
          console.log(`⚠️  Backend server not running on port 5000`);
          console.log(`   Start with: cd backend && npm start`);
          resolve(false);
        });
        req.setTimeout(2000);
      });
    }
  }
];

async function runChecks() {
  for (const check of checks) {
    const result = await Promise.resolve(check.check());
    if (result === false) {
      allGood = false;
    }
    console.log();
  }

  console.log('='.repeat(70));
  if (allGood) {
    console.log('✅ All systems ready! Run: npm run test:enhanced');
  } else {
    console.log('⚠️  Some issues detected. See above for details.');
    console.log('\nNext steps:');
    console.log('1. Ensure dependencies installed: npm install');
    console.log('2. Start backend: cd backend && npm start');
    console.log('3. Start frontend: cd frontend && npm start');
    console.log('4. Run tests: npm run test:enhanced');
  }
  console.log('='.repeat(70) + '\n');
}

runChecks();
