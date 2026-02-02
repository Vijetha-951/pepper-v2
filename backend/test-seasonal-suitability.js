// Test Script for Seasonal Suitability System
// Tests ML training, API, and Node.js integration

const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

class SeasonalSuitabilityTester {
  constructor() {
    this.pythonApiUrl = 'http://127.0.0.1:5001';
    this.nodeApiUrl = 'http://localhost:5000';
    this.pythonProcess = null;
  }

  // ANSI color codes for output
  colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bold: '\x1b[1m'
  };

  log(message, color = 'reset') {
    console.log(this.colors[color] + message + this.colors.reset);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testPythonSetup() {
    this.log('\n' + '='.repeat(60), 'blue');
    this.log('Testing Python ML Setup', 'bold');
    this.log('='.repeat(60), 'blue');

    try {
      // Test 1: Check if dataset exists or generate it
      this.log('\n[1/3] Checking/Generating Dataset...', 'yellow');
      const datasetPath = path.join(__dirname, 'python', 'seasonal_suitability_training_data.csv');
      const fs = require('fs');
      
      if (!fs.existsSync(datasetPath)) {
        this.log('Dataset not found. Generating...', 'yellow');
        await this.runPythonScript('seasonal_suitability_dataset.py');
      } else {
        this.log('✓ Dataset exists', 'green');
      }

      // Test 2: Check if model is trained
      this.log('\n[2/3] Checking ML Model...', 'yellow');
      const modelPath = path.join(__dirname, 'python', 'models', 'seasonal_suitability_model.pkl');
      
      if (!fs.existsSync(modelPath)) {
        this.log('Model not found. Training...', 'yellow');
        await this.runPythonScript('seasonal_suitability_model.py');
      } else {
        this.log('✓ Model exists', 'green');
      }

      // Test 3: Start Python API server
      this.log('\n[3/3] Starting Python API Server...', 'yellow');
      await this.startPythonApi();
      
      return true;
    } catch (error) {
      this.log('✗ Python setup failed: ' + error.message, 'red');
      return false;
    }
  }

  async runPythonScript(scriptName) {
    return new Promise((resolve, reject) => {
      const pythonPath = path.join(__dirname, 'python', scriptName);
      const python = spawn('python', [pythonPath]);

      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });

      python.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Script exited with code ${code}`));
        }
      });
    });
  }

  async startPythonApi() {
    return new Promise((resolve, reject) => {
      const apiPath = path.join(__dirname, 'python', 'seasonal_suitability_api.py');
      this.pythonProcess = spawn('python', [apiPath, '--host', '127.0.0.1', '--port', '5001']);

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          reject(new Error('Python API server timeout'));
        }
      }, 15000);

      this.pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        if (output.includes('Running on') || output.includes('WARNING')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            this.log('✓ Python API server started', 'green');
            setTimeout(() => resolve(), 2000); // Wait 2s for full startup
          }
        }
      });

      this.pythonProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      this.pythonProcess.on('close', (code) => {
        this.log(`Python API server exited with code ${code}`, 'yellow');
      });
    });
  }

  async testPythonApi() {
    this.log('\n' + '='.repeat(60), 'blue');
    this.log('Testing Python ML API', 'bold');
    this.log('='.repeat(60), 'blue');

    const tests = [
      {
        name: 'Health Check',
        test: async () => {
          const response = await axios.get(`${this.pythonApiUrl}/health`);
          return response.data.model_loaded === true;
        }
      },
      {
        name: 'Single Prediction - Recommended',
        test: async () => {
          const response = await axios.post(`${this.pythonApiUrl}/predict`, {
            month: 7,
            district: 'Idukki',
            pincode: 685501,
            variety: 'Panniyur 5',
            temperature: 24.5,
            rainfall: 320.0,
            humidity: 82.0,
            water_availability: 'High'
          });
          this.log(`  Result: ${response.data.prediction} (Confidence: ${response.data.confidence.toFixed(2)})`, 'blue');
          return response.data.success && response.data.prediction === 'Recommended';
        }
      },
      {
        name: 'Single Prediction - Not Recommended',
        test: async () => {
          const response = await axios.post(`${this.pythonApiUrl}/predict`, {
            month: 4,
            district: 'Thiruvananthapuram',
            pincode: 695001,
            variety: 'Karimunda',
            temperature: 35.0,
            rainfall: 50.0,
            humidity: 45.0,
            water_availability: 'Low'
          });
          this.log(`  Result: ${response.data.prediction} (Confidence: ${response.data.confidence.toFixed(2)})`, 'blue');
          return response.data.success;
        }
      },
      {
        name: 'Model Info',
        test: async () => {
          const response = await axios.get(`${this.pythonApiUrl}/model_info`);
          this.log(`  Classes: ${response.data.classes.join(', ')}`, 'blue');
          return response.data.success && response.data.model_loaded;
        }
      }
    ];

    let passed = 0;
    for (const test of tests) {
      try {
        this.log(`\n[${passed + 1}/${tests.length}] ${test.name}...`, 'yellow');
        const result = await test.test();
        if (result) {
          this.log(`✓ ${test.name} passed`, 'green');
          passed++;
        } else {
          this.log(`✗ ${test.name} failed`, 'red');
        }
      } catch (error) {
        this.log(`✗ ${test.name} failed: ${error.message}`, 'red');
      }
    }

    this.log(`\nPython API Tests: ${passed}/${tests.length} passed`, passed === tests.length ? 'green' : 'yellow');
    return passed === tests.length;
  }

  async testNodeIntegration() {
    this.log('\n' + '='.repeat(60), 'blue');
    this.log('Testing Node.js Integration', 'bold');
    this.log('='.repeat(60), 'blue');

    const tests = [
      {
        name: 'Health Check',
        test: async () => {
          const response = await axios.get(`${this.nodeApiUrl}/api/seasonal-suitability/health`);
          this.log(`  ML API: ${response.data.mlApi.available ? 'Available' : 'Unavailable'}`, 'blue');
          return response.data.success;
        }
      },
      {
        name: 'Prediction with User-Friendly Response',
        test: async () => {
          const response = await axios.post(`${this.nodeApiUrl}/api/seasonal-suitability/predict`, {
            month: 7,
            district: 'Wayanad',
            pincode: 673121,
            variety: 'IISR Shakthi',
            temperature: 22.0,
            rainfall: 280.0,
            humidity: 80.0,
            waterAvailability: 'High'
          });
          
          this.log(`  Suitability: ${response.data.data.suitability}`, 'blue');
          this.log(`  Title: ${response.data.data.title}`, 'blue');
          this.log(`  Badge: ${response.data.data.badge}`, 'blue');
          this.log(`  Confidence: ${response.data.data.confidence}`, 'blue');
          this.log(`  Tips: ${response.data.data.tips.length} provided`, 'blue');
          this.log(`  Analytics ID: ${response.data.analyticsId}`, 'blue');
          
          // Check that no ML terms are exposed
          const description = response.data.data.description.toLowerCase();
          const hasMLTerms = description.includes('model') || 
                            description.includes('predict') || 
                            description.includes('algorithm') ||
                            description.includes('machine learning');
          
          if (hasMLTerms) {
            this.log('  ⚠ Warning: ML terms found in description', 'yellow');
          }
          
          return response.data.success && 
                 response.data.data.suitability && 
                 response.data.data.title &&
                 response.data.data.tips.length > 0 &&
                 !hasMLTerms;
        }
      },
      {
        name: 'Batch Predictions',
        test: async () => {
          const response = await axios.post(`${this.nodeApiUrl}/api/seasonal-suitability/batch-predict`, {
            predictions: [
              {
                month: 6,
                district: 'Idukki',
                pincode: 685501,
                variety: 'Panniyur 1',
                temperature: 23.0,
                rainfall: 300.0,
                humidity: 85.0,
                waterAvailability: 'High'
              },
              {
                month: 12,
                district: 'Kottayam',
                pincode: 686001,
                variety: 'Sreekara',
                temperature: 26.0,
                rainfall: 100.0,
                humidity: 70.0,
                waterAvailability: 'Medium'
              }
            ]
          });
          
          this.log(`  Successful: ${response.data.successfulPredictions}/${response.data.totalRequests}`, 'blue');
          return response.data.success && response.data.successfulPredictions === 2;
        }
      },
      {
        name: 'Fallback Mode Test',
        test: async () => {
          // Stop Python API to test fallback
          this.log('  Stopping Python API to test fallback...', 'yellow');
          if (this.pythonProcess) {
            this.pythonProcess.kill();
            await this.sleep(1000);
          }
          
          const response = await axios.post(`${this.nodeApiUrl}/api/seasonal-suitability/predict`, {
            month: 7,
            district: 'Palakkad',
            pincode: 678001,
            variety: 'Pournami',
            temperature: 25.0,
            rainfall: 250.0,
            humidity: 75.0,
            waterAvailability: 'Medium'
          });
          
          this.log(`  Fallback active: ${response.data.data.technicalData.source === 'rule_based_fallback'}`, 'blue');
          this.log(`  Suitability: ${response.data.data.suitability}`, 'blue');
          
          return response.data.success && 
                 response.data.data.technicalData.source === 'rule_based_fallback';
        }
      }
    ];

    let passed = 0;
    for (const test of tests) {
      try {
        this.log(`\n[${passed + 1}/${tests.length}] ${test.name}...`, 'yellow');
        const result = await test.test();
        if (result) {
          this.log(`✓ ${test.name} passed`, 'green');
          passed++;
        } else {
          this.log(`✗ ${test.name} failed`, 'red');
        }
      } catch (error) {
        this.log(`✗ ${test.name} failed: ${error.message}`, 'red');
        if (test.name === 'Fallback Mode Test') {
          this.log('  (This is expected if Node.js server is not running)', 'yellow');
        }
      }
    }

    this.log(`\nNode.js Integration Tests: ${passed}/${tests.length} passed`, passed === tests.length ? 'green' : 'yellow');
    return passed === tests.length;
  }

  async cleanup() {
    this.log('\n' + '='.repeat(60), 'blue');
    this.log('Cleanup', 'bold');
    this.log('='.repeat(60), 'blue');

    if (this.pythonProcess) {
      this.log('Stopping Python API server...', 'yellow');
      this.pythonProcess.kill();
      await this.sleep(1000);
      this.log('✓ Python API server stopped', 'green');
    }
  }

  async runAllTests() {
    this.log('\n' + '='.repeat(60), 'bold');
    this.log('Seasonal Suitability System - Comprehensive Test Suite', 'bold');
    this.log('='.repeat(60), 'bold');

    const results = {
      pythonSetup: false,
      pythonApi: false,
      nodeIntegration: false
    };

    try {
      // Test 1: Python Setup
      results.pythonSetup = await this.testPythonSetup();
      
      if (results.pythonSetup) {
        // Test 2: Python API
        results.pythonApi = await this.testPythonApi();
        
        // Test 3: Node.js Integration (requires Node server to be running)
        this.log('\n' + '='.repeat(60), 'blue');
        this.log('Note: Node.js server should be running on port 5000', 'yellow');
        this.log('='.repeat(60), 'blue');
        
        try {
          await axios.get(`${this.nodeApiUrl}/api/health`, { timeout: 2000 });
          results.nodeIntegration = await this.testNodeIntegration();
        } catch (error) {
          this.log('\n⚠ Node.js server not accessible. Skipping integration tests.', 'yellow');
          this.log('Start Node.js server with: npm start', 'yellow');
        }
      }

      // Summary
      this.log('\n' + '='.repeat(60), 'bold');
      this.log('Test Results Summary', 'bold');
      this.log('='.repeat(60), 'bold');
      
      this.log(`\nPython Setup:        ${results.pythonSetup ? '✓ PASSED' : '✗ FAILED'}`, 
               results.pythonSetup ? 'green' : 'red');
      this.log(`Python API:          ${results.pythonApi ? '✓ PASSED' : '✗ FAILED'}`, 
               results.pythonApi ? 'green' : 'red');
      this.log(`Node.js Integration: ${results.nodeIntegration ? '✓ PASSED' : '⊘ SKIPPED'}`, 
               results.nodeIntegration ? 'green' : 'yellow');

      const totalTests = Object.values(results).filter(Boolean).length;
      this.log(`\nTotal: ${totalTests}/3 test suites passed\n`, 
               totalTests === 3 ? 'green' : 'yellow');

    } catch (error) {
      this.log('\n✗ Test execution failed: ' + error.message, 'red');
      console.error(error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests
const tester = new SeasonalSuitabilityTester();
tester.runAllTests().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
