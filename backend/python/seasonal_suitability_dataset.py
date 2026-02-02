"""
Seasonal Suitability Dataset Generator for Pepper Varieties
Generates training data based on Kerala's climatic conditions and pepper cultivation practices
"""

import pandas as pd
import numpy as np
from datetime import datetime

class SeasonalSuitabilityDataGenerator:
    """Generates training dataset for pepper variety seasonal suitability"""
    
    # Kerala districts with typical characteristics
    DISTRICTS = [
        'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 
        'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 
        'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
    ]
    
    # Common pepper varieties in Kerala
    VARIETIES = [
        'Panniyur 1', 'Panniyur 5', 'Karimunda', 'Subhakara', 
        'Pournami', 'IISR Shakthi', 'IISR Thevam', 'Sreekara'
    ]
    
    # Pincode ranges by district (representative samples)
    DISTRICT_PINCODES = {
        'Thiruvananthapuram': [695001, 695014, 695024, 695033],
        'Kollam': [691001, 691008, 691013, 691020],
        'Pathanamthitta': [689645, 689661, 689695, 689699],
        'Alappuzha': [688001, 688011, 688531, 688561],
        'Kottayam': [686001, 686013, 686502, 686651],
        'Idukki': [685501, 685531, 685565, 685612],
        'Ernakulam': [682001, 682016, 683101, 683572],
        'Thrissur': [680001, 680014, 680301, 680652],
        'Palakkad': [678001, 678014, 678551, 679121],
        'Malappuram': [676101, 676301, 676505, 679323],
        'Kozhikode': [673001, 673017, 673572, 673639],
        'Wayanad': [670644, 673121, 673575, 673593],
        'Kannur': [670001, 670014, 670591, 670702],
        'Kasaragod': [671121, 671314, 671531, 671552]
    }
    
    def __init__(self):
        self.dataset = []
        
    def _determine_suitability(self, month, district, variety, temp, rainfall, humidity, water_avail):
        """
        Rule-based suitability determination based on agronomic knowledge
        Returns: 'Recommended', 'Plant with Care', or 'Not Recommended'
        """
        
        # Planting season optimization (June-July is ideal for Kerala)
        is_planting_season = month in [6, 7]
        is_monsoon = month in [6, 7, 8, 9]  # June to September
        is_winter = month in [12, 1, 2]
        is_summer = month in [3, 4, 5]
        
        # High altitude districts (better for pepper)
        highland_districts = ['Idukki', 'Wayanad', 'Pathanamthitta']
        is_highland = district in highland_districts
        
        # Variety-specific preferences
        drought_tolerant = ['Panniyur 1', 'IISR Shakthi', 'Karimunda']
        high_yield_varieties = ['Panniyur 5', 'Sreekara', 'Pournami']
        disease_resistant = ['IISR Thevam', 'Subhakara', 'IISR Shakthi']
        
        # Temperature suitability (optimal: 20-30°C)
        temp_optimal = 20 <= temp <= 30
        temp_acceptable = 18 <= temp <= 35
        
        # Rainfall suitability (optimal: 150-300mm/month during growing)
        rainfall_optimal = 150 <= rainfall <= 300
        rainfall_acceptable = 100 <= rainfall <= 400
        
        # Humidity suitability (optimal: 60-85%)
        humidity_optimal = 60 <= humidity <= 85
        humidity_acceptable = 50 <= humidity <= 90
        
        # Water availability
        water_sufficient = water_avail in ['High', 'Medium']
        
        # Scoring system
        score = 0
        
        # Temperature scoring
        if temp_optimal:
            score += 2
        elif temp_acceptable:
            score += 1
        else:
            score -= 2
            
        # Rainfall scoring
        if rainfall_optimal:
            score += 2
        elif rainfall_acceptable:
            score += 1
        elif rainfall > 500:
            score -= 2  # Excessive rain
        else:
            score -= 1  # Too little rain
            
        # Humidity scoring
        if humidity_optimal:
            score += 1
        elif not humidity_acceptable:
            score -= 1
            
        # Water availability scoring
        if water_sufficient:
            score += 1
        else:
            score -= 2
            
        # Seasonal bonus
        if is_planting_season:
            score += 3  # Major bonus for planting season
        elif is_monsoon:
            score += 1  # Good for established plants
        elif is_summer and water_avail == 'Low':
            score -= 2  # Risky in summer with low water
            
        # Location bonus
        if is_highland:
            score += 1  # Highland areas are better for pepper
            
        # Variety-specific adjustments
        if variety in drought_tolerant and water_avail == 'Low':
            score += 1  # Drought tolerant varieties cope better
        if variety in disease_resistant and humidity > 85:
            score += 1  # Disease resistant varieties handle high humidity
        if variety in high_yield_varieties and temp_optimal and water_sufficient:
            score += 1  # High yield varieties need good conditions
            
        # Final classification
        if score >= 6:
            return 'Recommended'
        elif score >= 2:
            return 'Plant with Care'
        else:
            return 'Not Recommended'
    
    def generate_dataset(self, samples_per_combination=10):
        """
        Generate comprehensive training dataset
        Creates realistic variations for each combination
        """
        print("Generating seasonal suitability dataset...")
        
        for district in self.DISTRICTS:
            pincodes = self.DISTRICT_PINCODES[district]
            
            for variety in self.VARIETIES:
                for month in range(1, 13):  # All 12 months
                    for pincode in pincodes:
                        # Generate multiple samples with variation
                        for _ in range(samples_per_combination):
                            # Generate realistic weather parameters based on Kerala seasons
                            temp, rainfall, humidity = self._generate_weather_params(month, district)
                            water_avail = self._generate_water_availability(month, rainfall)
                            
                            # Determine suitability label
                            suitability = self._determine_suitability(
                                month, district, variety, temp, rainfall, humidity, water_avail
                            )
                            
                            # Add to dataset
                            self.dataset.append({
                                'month': month,
                                'district': district,
                                'pincode': pincode,
                                'variety': variety,
                                'temperature': temp,
                                'rainfall': rainfall,
                                'humidity': humidity,
                                'water_availability': water_avail,
                                'suitability': suitability
                            })
        
        print(f"Generated {len(self.dataset)} training samples")
        return pd.DataFrame(self.dataset)
    
    def _generate_weather_params(self, month, district):
        """Generate realistic weather parameters based on Kerala's climate"""
        # Highland vs lowland temperature differences
        highland_districts = ['Idukki', 'Wayanad', 'Pathanamthitta']
        is_highland = district in highland_districts
        
        # Monsoon months (June-September)
        if month in [6, 7, 8, 9]:
            base_temp = 23 if is_highland else 26
            temp = np.random.normal(base_temp, 2)
            rainfall = np.random.normal(350, 100)  # Heavy monsoon
            humidity = np.random.normal(85, 5)
            
        # Winter months (December-February)
        elif month in [12, 1, 2]:
            base_temp = 20 if is_highland else 25
            temp = np.random.normal(base_temp, 2)
            rainfall = np.random.normal(50, 30)  # Low rainfall
            humidity = np.random.normal(70, 10)
            
        # Pre-monsoon/Summer (March-May)
        elif month in [3, 4, 5]:
            base_temp = 28 if is_highland else 32
            temp = np.random.normal(base_temp, 2)
            rainfall = np.random.normal(120, 50)  # Moderate pre-monsoon showers
            humidity = np.random.normal(75, 8)
            
        # Post-monsoon (October-November)
        else:
            base_temp = 24 if is_highland else 27
            temp = np.random.normal(base_temp, 2)
            rainfall = np.random.normal(200, 80)  # Retreating monsoon
            humidity = np.random.normal(80, 7)
        
        # Ensure realistic bounds
        temp = np.clip(temp, 15, 38)
        rainfall = np.clip(rainfall, 0, 600)
        humidity = np.clip(humidity, 40, 95)
        
        return round(temp, 1), round(rainfall, 1), round(humidity, 1)
    
    def _generate_water_availability(self, month, rainfall):
        """Determine water availability based on month and rainfall"""
        if month in [6, 7, 8, 9] or rainfall > 250:
            # Monsoon months or high rainfall
            return np.random.choice(['High', 'Medium'], p=[0.8, 0.2])
        elif month in [3, 4, 5] and rainfall < 100:
            # Summer with low rainfall
            return np.random.choice(['Low', 'Medium'], p=[0.7, 0.3])
        else:
            # Other months
            return np.random.choice(['Medium', 'High', 'Low'], p=[0.5, 0.3, 0.2])
    
    def save_dataset(self, filename='seasonal_suitability_training_data.csv'):
        """Save generated dataset to CSV"""
        if not self.dataset:
            print("No dataset generated. Call generate_dataset() first.")
            return False
            
        df = pd.DataFrame(self.dataset)
        filepath = os.path.join(os.path.dirname(__file__), filename)
        df.to_csv(filepath, index=False)
        print(f"Dataset saved to: {filepath}")
        print(f"Total samples: {len(df)}")
        print(f"\nClass distribution:")
        print(df['suitability'].value_counts())
        print(f"\nDataset shape: {df.shape}")
        return True


if __name__ == '__main__':
    import os
    
    # Generate dataset
    generator = SeasonalSuitabilityDataGenerator()
    df = generator.generate_dataset(samples_per_combination=5)
    
    # Display statistics
    print("\n" + "="*60)
    print("Dataset Statistics")
    print("="*60)
    print(f"\nTotal samples: {len(df)}")
    print(f"\nFeatures: {list(df.columns)}")
    print(f"\nSuitability distribution:")
    print(df['suitability'].value_counts())
    print(f"\nVarieties: {df['variety'].nunique()}")
    print(f"Districts: {df['district'].nunique()}")
    print(f"\nSample data:")
    print(df.head(10))
    
    # Save dataset
    generator.save_dataset()
