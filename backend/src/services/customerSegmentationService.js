import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CustomerSegmentationService {
  static async segmentCustomers(customersData) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        path.join(__dirname, '../../python/customer_segmentation.py')
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Python process failed: ${errorOutput}`));
        }

        try {
          const result = JSON.parse(output);
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error || 'Unknown error'));
          }
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${err.message}`));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(customersData));
      pythonProcess.stdin.end();
    });
  }

  static async segmentSingleCustomer(customerData) {
    return this.segmentCustomers(customerData);
  }
}

export default CustomerSegmentationService;
