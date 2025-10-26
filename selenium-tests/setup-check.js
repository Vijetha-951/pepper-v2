const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 PEPPER Selenium Test Setup');
console.log('================================');

// Check if we're in the right directory
const currentDir = process.cwd();
console.log(`Current directory: ${currentDir}`);

// Check if package.json exists
const packageJsonPath = path.join(currentDir, 'package.json');
try {
  const packageJson = require(packageJsonPath);
  console.log(`✅ Found package.json: ${packageJson.name}`);
} catch (e) {
  console.log('❌ package.json not found. Please run this from the selenium-tests directory.');
  process.exit(1);
}

// Check Node.js version
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (e) {
  console.log('❌ Node.js not found. Please install Node.js first.');
  process.exit(1);
}

// Check if dependencies are installed
try {
  const nodeModulesPath = path.join(currentDir, 'node_modules');
  require('fs').accessSync(nodeModulesPath);
  console.log('✅ Dependencies already installed');
} catch (e) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.log('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Check if Chrome is available
try {
  execSync('google-chrome --version', { encoding: 'utf8' });
  console.log('✅ Chrome browser detected');
} catch (e) {
  try {
    execSync('chrome --version', { encoding: 'utf8' });
    console.log('✅ Chrome browser detected');
  } catch (e2) {
    console.log('⚠️  Chrome browser not detected. Tests will use Firefox if available.');
  }
}

// Check if Firefox is available
try {
  execSync('firefox --version', { encoding: 'utf8' });
  console.log('✅ Firefox browser detected');
} catch (e) {
  console.log('⚠️  Firefox browser not detected. Tests will use Chrome if available.');
}

console.log('\n🎯 Test Configuration:');
console.log('======================');
console.log('Base URL: http://localhost:3000');
console.log('Browser: Chrome (default)');
console.log('Headless: false (default)');
console.log('Timeout: 30 seconds per test');

console.log('\n📋 Available Commands:');
console.log('=====================');
console.log('npm test                 - Run all tests');
console.log('npm run test:headless    - Run tests in headless mode');
console.log('npm run test:chrome      - Run tests with Chrome');
console.log('npm run test:firefox     - Run tests with Firefox');
console.log('npm run test:watch       - Run tests in watch mode');

console.log('\n🔧 Environment Variables:');
console.log('========================');
console.log('BASE_URL=http://localhost:3000  - Set custom base URL');
console.log('BROWSER=chrome                  - Set browser (chrome/firefox)');
console.log('HEADLESS=true                   - Run in headless mode');

console.log('\n⚠️  Important Notes:');
console.log('===================');
console.log('1. Make sure your PEPPER application is running on localhost:3000');
console.log('2. Tests will take screenshots in tests/screenshots/ directory');
console.log('3. Tests are designed to run independently without affecting your main project');
console.log('4. If tests fail, check the screenshots for debugging');

console.log('\n✅ Setup complete! You can now run: npm test');
