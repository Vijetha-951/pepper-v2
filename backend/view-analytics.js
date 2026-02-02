// View Analytics Dashboard
import axios from 'axios';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function viewAnalytics() {
  console.log('\n' + colors.bold + '='.repeat(70) + colors.reset);
  console.log(colors.bold + '  Seasonal Suitability Analytics Dashboard' + colors.reset);
  console.log(colors.bold + '='.repeat(70) + colors.reset + '\n');

  const baseUrl = 'http://localhost:5000/api/seasonal-suitability';

  // 1. Overall Summary
  console.log(colors.cyan + '📊 Overall Summary' + colors.reset);
  console.log('─'.repeat(70));
  
  try {
    const summary = await axios.get(`${baseUrl}/analytics/summary`);
    const data = summary.data.data;

    console.log(colors.green + '\n✓ Analytics Retrieved' + colors.reset);
    console.log(`  Total Recommendations: ${data.totalRecommendations || 0}`);
    console.log(`  Viewed Details: ${data.totalViewed || 0}`);
    console.log(`  Added to Cart: ${data.totalAddedToCart || 0}`);
    console.log(`  Orders Placed: ${data.totalOrders || 0}`);
    
    if (data.totalRecommendations > 0) {
      const conversionRate = ((data.totalOrders / data.totalRecommendations) * 100).toFixed(2);
      console.log(`  Conversion Rate: ${conversionRate}%`);
    }
    
    console.log(`  Average Confidence: ${(data.avgConfidence || 0).toFixed(2)}`);
    console.log(`  ML Predictions: ${data.mlPredictions || 0}`);
    console.log(`  Fallback Predictions: ${data.fallbackPredictions || 0}`);

  } catch (error) {
    if (error.response?.status === 404) {
      console.log(colors.yellow + '\n⚠ No analytics data yet' + colors.reset);
      console.log('  Make some predictions first to see analytics');
    } else {
      console.log(colors.red + '\n✗ Failed to fetch summary: ' + error.message + colors.reset);
    }
  }

  // 2. Variety-wise Analytics
  console.log('\n' + colors.cyan + '\n🌱 Variety-wise Performance' + colors.reset);
  console.log('─'.repeat(70) + '\n');
  
  try {
    const varieties = await axios.get(`${baseUrl}/analytics/by-variety`);
    const data = varieties.data.data;

    if (data && data.length > 0) {
      data.forEach((variety, index) => {
        console.log(colors.bold + `${index + 1}. ${variety.variety}` + colors.reset);
        console.log(`   Total Predictions: ${variety.totalPredictions}`);
        console.log(`   Conversions: ${variety.totalConversions}`);
        console.log(`   Conversion Rate: ${variety.conversionRate.toFixed(2)}%`);
        
        if (variety.predictions && variety.predictions.length > 0) {
          console.log(`   Breakdown:`);
          variety.predictions.forEach(pred => {
            const percentage = ((pred.count / variety.totalPredictions) * 100).toFixed(1);
            console.log(`     - ${pred.suitability}: ${pred.count} (${percentage}%)`);
          });
        }
        console.log('');
      });
    } else {
      console.log(colors.yellow + '  No variety data available yet' + colors.reset);
    }

  } catch (error) {
    if (error.response?.status === 404) {
      console.log(colors.yellow + '  No variety analytics yet' + colors.reset);
    } else {
      console.log(colors.red + '  Failed to fetch variety analytics: ' + error.message + colors.reset);
    }
  }

  // 3. Quick Test Recommendations
  console.log(colors.cyan + '\n💡 Quick Actions' + colors.reset);
  console.log('─'.repeat(70));
  console.log('\n  To generate analytics data, make predictions:');
  console.log(colors.blue + '    node test-user-friendly.js' + colors.reset);
  console.log('\n  Or test the API directly:');
  console.log(colors.blue + '    curl -X POST http://localhost:5000/api/seasonal-suitability/predict \\');
  console.log('      -H "Content-Type: application/json" \\');
  console.log('      -d "{\\"month\\": 7, \\"district\\": \\"Idukki\\", ...}"' + colors.reset);
  
  console.log('\n' + colors.bold + '='.repeat(70) + colors.reset + '\n');
}

viewAnalytics().catch(console.error);
