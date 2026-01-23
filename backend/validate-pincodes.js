// Script to validate pincode-to-district mappings
import { pincodeCoordinates } from './src/data/pincodeCoordinates.js';

// Kerala pincode prefix ranges by district
const districtPrefixes = {
  'Thiruvananthapuram': ['695'],
  'Kollam': ['691'],
  'Pathanamthitta': ['689'],
  'Alappuzha': ['688'],
  'Kottayam': ['686'],
  'Idukki': ['685'],
  'Ernakulam': ['682', '683', '686'],
  'Thrissur': ['680', '679'],
  'Palakkad': ['678', '679'],
  'Malappuram': ['676', '673'],
  'Kozhikode': ['673'],
  'Wayanad': ['673', '670'],
  'Kannur': ['670'],
  'Kasaragod': ['671', '670']
};

// Function to get expected districts for a pincode based on prefix
function getExpectedDistricts(pincode) {
  const prefix = pincode.substring(0, 3);
  const possibleDistricts = [];
  
  for (const [district, prefixes] of Object.entries(districtPrefixes)) {
    if (prefixes.includes(prefix)) {
      possibleDistricts.push(district);
    }
  }
  
  return possibleDistricts;
}

console.log('🔍 VALIDATING PINCODE-TO-DISTRICT MAPPINGS\n');
console.log('=' .repeat(80));

const issues = [];
const summary = {
  total: 0,
  correct: 0,
  suspicious: 0,
  errors: 0
};

// Check each pincode
for (const [pincode, data] of Object.entries(pincodeCoordinates)) {
  summary.total++;
  const expectedDistricts = getExpectedDistricts(pincode);
  
  if (expectedDistricts.length === 0) {
    issues.push({
      pincode,
      assigned: data.district,
      expected: 'UNKNOWN',
      severity: 'ERROR',
      message: `Pincode prefix ${pincode.substring(0, 3)} not in Kerala district ranges`
    });
    summary.errors++;
  } else if (!expectedDistricts.includes(data.district)) {
    // Check if it's a known exception
    const isException = (
      (pincode.startsWith('685') && data.district === 'Pathanamthitta') || // Some 685xxx are Pathanamthitta border areas
      (pincode.startsWith('686') && data.district === 'Ernakulam') || // Some 686xxx are Ernakulam
      (pincode.startsWith('670') && ['Kasaragod', 'Kannur', 'Wayanad'].includes(data.district)) || // 670 shared
      (pincode.startsWith('673') && ['Kozhikode', 'Wayanad', 'Malappuram'].includes(data.district)) || // 673 shared
      (pincode.startsWith('679') && ['Thrissur', 'Palakkad'].includes(data.district)) // 679 shared
    );
    
    if (!isException) {
      issues.push({
        pincode,
        assigned: data.district,
        expected: expectedDistricts.join(' OR '),
        severity: 'SUSPICIOUS',
        message: `District mismatch - expected ${expectedDistricts.join('/')} but got ${data.district}`
      });
      summary.suspicious++;
    } else {
      summary.correct++;
    }
  } else {
    summary.correct++;
  }
}

// Display results
console.log('\n📊 SUMMARY:');
console.log('─'.repeat(80));
console.log(`Total Pincodes: ${summary.total}`);
console.log(`✅ Correct: ${summary.correct} (${(summary.correct/summary.total*100).toFixed(1)}%)`);
console.log(`⚠️  Suspicious: ${summary.suspicious} (${(summary.suspicious/summary.total*100).toFixed(1)}%)`);
console.log(`❌ Errors: ${summary.errors} (${(summary.errors/summary.total*100).toFixed(1)}%)`);

if (issues.length > 0) {
  console.log('\n\n⚠️  ISSUES FOUND:\n');
  console.log('─'.repeat(80));
  
  // Group by severity
  const errors = issues.filter(i => i.severity === 'ERROR');
  const suspicious = issues.filter(i => i.severity === 'SUSPICIOUS');
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (Invalid Pincode Ranges):');
    console.log('─'.repeat(80));
    errors.forEach(issue => {
      console.log(`\nPincode: ${issue.pincode}`);
      console.log(`  Assigned District: ${issue.assigned}`);
      console.log(`  Expected: ${issue.expected}`);
      console.log(`  Issue: ${issue.message}`);
    });
  }
  
  if (suspicious.length > 0) {
    console.log('\n\n⚠️  SUSPICIOUS (May Need Review):');
    console.log('─'.repeat(80));
    suspicious.forEach(issue => {
      console.log(`\nPincode: ${issue.pincode}`);
      console.log(`  Assigned District: ${issue.assigned}`);
      console.log(`  Expected: ${issue.expected}`);
      console.log(`  Issue: ${issue.message}`);
    });
  }
  
  console.log('\n\n💡 RECOMMENDATIONS:');
  console.log('─'.repeat(80));
  console.log('1. Verify suspicious pincodes using official sources (India Post, Google Maps)');
  console.log('2. Border areas may legitimately belong to different districts');
  console.log('3. Fix errors immediately as they use invalid pincode ranges');
  console.log('4. Test hub assignment after fixing to ensure correct district matching');
} else {
  console.log('\n\n✅ All pincodes appear to be correctly mapped!');
}

console.log('\n' + '='.repeat(80));
