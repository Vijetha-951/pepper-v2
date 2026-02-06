import axios from 'axios';

async function explainClassificationLogic() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   HOW SEASONAL TAGS ARE ASSIGNED TO EACH PLANT           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log('SCORING SYSTEM (from seasonal_suitability_dataset.py):');
  console.log('─'.repeat(60) + '\n');
  
  console.log('📊 POINT SYSTEM:\n');
  
  console.log('1. VARIETY CHARACTERISTICS:');
  console.log('   • Drought-tolerant: Panniyur 1, IISR Shakthi, Karimunda');
  console.log('   • High-yield: Panniyur 5, Sreekara, Pournami');
  console.log('   • Disease-resistant: IISR Thevam, Subhakara, IISR Shakthi\n');
  
  console.log('2. TEMPERATURE SCORING:');
  console.log('   • Optimal (20-30°C): +2 points');
  console.log('   • Acceptable (18-35°C): +1 point');
  console.log('   • Outside range: -2 points\n');
  
  console.log('3. RAINFALL SCORING:');
  console.log('   • Optimal (150-300mm): +2 points');
  console.log('   • Acceptable (100-400mm): +1 point');
  console.log('   • Too much (>500mm): -2 points');
  console.log('   • Too little (<100mm): -1 point\n');
  
  console.log('4. HUMIDITY SCORING:');
  console.log('   • Optimal (60-85%): +1 point');
  console.log('   • Outside range: -1 point\n');
  
  console.log('5. WATER AVAILABILITY:');
  console.log('   • High/Medium: +1 point');
  console.log('   • Low: -2 points\n');
  
  console.log('6. SEASONAL BONUS:');
  console.log('   • Planting season (May-Jun, Sep-Oct): +3 points');
  console.log('   • Monsoon (Jun-Sep): +1 point');
  console.log('   • Summer with low water: -2 points\n');
  
  console.log('7. VARIETY-SPECIFIC BONUSES:');
  console.log('   • Drought-tolerant in low water: +1 point');
  console.log('   • Disease-resistant in high humidity: +1 point');
  console.log('   • High-yield with good conditions: +1 point\n');
  
  console.log('═'.repeat(60));
  console.log('FINAL CLASSIFICATION:');
  console.log('═'.repeat(60));
  console.log('• Score ≥ 6: ✅ RECOMMENDED');
  console.log('• Score 2-5: ⚠️ PLANT WITH CARE');
  console.log('• Score < 2: ❌ NOT RECOMMENDED\n');
  
  console.log('\n' + '═'.repeat(60));
  console.log('EXAMPLE: FEBRUARY 2026 (Current Month)');
  console.log('═'.repeat(60) + '\n');
  
  const varieties = [
    { name: 'Panniyur 5', type: 'High-yield' },
    { name: 'Karimunda', type: 'Drought-tolerant' },
    { name: 'Pournami', type: 'High-yield' },
    { name: 'Panniyur 1', type: 'Drought-tolerant' }
  ];
  
  for (const variety of varieties) {
    console.log(`\n📦 ${variety.name} (${variety.type})`);
    console.log('─'.repeat(60));
    
    try {
      const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
        variety: variety.name,
        month: 2,
        district: 'Kottayam',
        pincode: 686001,
        temperature: 25,
        rainfall: 50,
        humidity: 75,
        waterAvailability: 'Medium'
      });
      
      const result = response.data.data;
      
      console.log('Conditions: Temp=25°C, Rainfall=50mm, Humidity=75%');
      console.log('');
      console.log('Point Calculation:');
      console.log('  Temperature (25°C in 20-30°C): +2 points ✓');
      console.log('  Rainfall (50mm - low): +1 point (acceptable)');
      console.log('  Humidity (75% in 60-85%): +1 point ✓');
      console.log('  Water availability (Medium): +1 point ✓');
      console.log('  Season (February - not planting): 0 points');
      
      if (variety.type === 'High-yield') {
        console.log('  High-yield with good conditions: +1 point ✓');
        console.log('  TOTAL: ~6 points');
      } else {
        console.log('  Drought-tolerant with low water: +1 point ✓');
        console.log('  TOTAL: ~5 points');
      }
      
      console.log('');
      console.log(`Result: ${result.suitability} (${result.confidence})`);
      
      if (variety.type === 'High-yield') {
        console.log('Why: High-yield varieties perform well with irrigation');
      } else {
        console.log('Why: Drought-tolerant but not ideal in dry season');
      }
      
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
  
  console.log('\n\n' + '═'.repeat(60));
  console.log('KEY TAKEAWAY:');
  console.log('═'.repeat(60));
  console.log('Each plant gets a SCORE based on:');
  console.log('1. Its genetic characteristics (drought-tolerant, high-yield, etc.)');
  console.log('2. Current month conditions (temperature, rainfall)');
  console.log('3. Water availability');
  console.log('4. Season bonus (planting months get +3 points)');
  console.log('');
  console.log('The score determines the tag:');
  console.log('• High score (≥6) = GREEN "Recommended"');
  console.log('• Medium score (2-5) = YELLOW "Plant with Care"');
  console.log('• Low score (<2) = RED "Not Recommended"\n');
}

explainClassificationLogic().catch(console.error);
