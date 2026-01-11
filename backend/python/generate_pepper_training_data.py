"""
Generate synthetic training data for pepper yield prediction
Based on agricultural research and best practices for pepper cultivation
"""

import pandas as pd
import numpy as np
import os

def generate_pepper_training_data(n_samples=2000):
    """
    Generate synthetic training data for pepper cultivation
    Based on realistic agricultural parameters
    """
    
    np.random.seed(42)
    
    # Define categorical options
    soil_types = ['Sandy', 'Loamy', 'Clay']
    water_availability = ['Low', 'Medium', 'High']
    crop_stages = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting']
    regions = ['Kerala', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Other']
    
    data = []
    
    for i in range(n_samples):
        # Generate input features
        soil_type = np.random.choice(soil_types)
        water_avail = np.random.choice(water_availability)
        crop_stage = np.random.choice(crop_stages)
        region = np.random.choice(regions)
        
        # Irrigation frequency (1-7 times per week)
        irrigation_freq = np.random.randint(1, 8)
        
        # Environmental parameters
        # Temperature: 20-35°C (optimal 25-30°C)
        temperature = np.random.uniform(20, 35)
        
        # Rainfall: 1500-3000 mm/year
        rainfall = np.random.uniform(1500, 3000)
        
        # Humidity: 60-90%
        humidity = np.random.uniform(60, 90)
        
        # Soil pH: 5.5-7.5 (optimal 6.0-6.5)
        if soil_type == 'Sandy':
            ph_level = np.random.uniform(5.5, 6.5)
        elif soil_type == 'Loamy':
            ph_level = np.random.uniform(6.0, 7.0)
        else:  # Clay
            ph_level = np.random.uniform(6.5, 7.5)
        
        # NPK levels (nitrogen, phosphorus, potassium) in ppm
        nitrogen_level = np.random.uniform(30, 80)
        phosphorus_level = np.random.uniform(20, 60)
        potassium_level = np.random.uniform(30, 70)
        
        # Calculate base yield and suitability
        yield_score = 0
        suitability_score = 0
        
        # Soil type impact
        soil_scores = {'Sandy': 0.7, 'Loamy': 1.0, 'Clay': 0.8}
        yield_score += soil_scores[soil_type]
        suitability_score += soil_scores[soil_type] * 100
        
        # Water availability impact
        water_scores = {'Low': 0.6, 'Medium': 0.85, 'High': 1.0}
        yield_score += water_scores[water_avail]
        suitability_score += water_scores[water_avail] * 100
        
        # Irrigation frequency impact (optimal: 3-5 times per week)
        if 3 <= irrigation_freq <= 5:
            irr_factor = 1.0
        elif irrigation_freq < 3:
            irr_factor = 0.7 + (irrigation_freq / 10)
        else:
            irr_factor = 0.9 - ((irrigation_freq - 5) / 20)
        
        yield_score += irr_factor
        suitability_score += irr_factor * 100
        
        # Temperature impact (optimal: 25-30°C)
        if 25 <= temperature <= 30:
            temp_factor = 1.0
        else:
            temp_factor = max(0.5, 1.0 - abs(temperature - 27.5) / 20)
        
        yield_score *= temp_factor
        suitability_score *= temp_factor
        
        # pH impact (optimal: 6.0-6.5)
        if 6.0 <= ph_level <= 6.5:
            ph_factor = 1.0
        else:
            ph_factor = max(0.6, 1.0 - abs(ph_level - 6.25) / 3)
        
        yield_score *= ph_factor
        suitability_score *= ph_factor
        
        # NPK impact
        npk_factor = (
            (nitrogen_level / 80) * 0.35 +
            (phosphorus_level / 60) * 0.30 +
            (potassium_level / 70) * 0.35
        )
        yield_score *= npk_factor
        suitability_score *= npk_factor
        
        # Crop stage impact on yield
        stage_multipliers = {
            'Seedling': 0.1,
            'Vegetative': 0.3,
            'Flowering': 0.6,
            'Fruiting': 1.0
        }
        yield_score *= stage_multipliers[crop_stage]
        
        # Calculate final yield (0.2 to 2.5 kg per plant)
        # Base yield ranges from 0.5 to 2.0, adjusted by factors
        base_yield = 1.2
        yield_kg = base_yield * yield_score
        
        # Add some random noise
        yield_kg *= np.random.uniform(0.85, 1.15)
        yield_kg = max(0.2, min(2.5, yield_kg))  # Clip to realistic range
        
        # Calculate soil suitability class
        # Normalize suitability score to 0-100 range
        suitability_score = min(100, max(0, suitability_score / 3))
        
        if suitability_score >= 70:
            soil_suitability = 'High'
        elif suitability_score >= 40:
            soil_suitability = 'Medium'
        else:
            soil_suitability = 'Low'
        
        # Create data row
        row = {
            'soil_type': soil_type,
            'water_availability': water_avail,
            'irrigation_frequency': irrigation_freq,
            'crop_stage': crop_stage,
            'region': region,
            'temperature': round(temperature, 2),
            'rainfall': round(rainfall, 2),
            'humidity': round(humidity, 2),
            'ph_level': round(ph_level, 2),
            'nitrogen_level': round(nitrogen_level, 2),
            'phosphorus_level': round(phosphorus_level, 2),
            'potassium_level': round(potassium_level, 2),
            'yield_kg_per_plant': round(yield_kg, 3),
            'soil_suitability': soil_suitability
        }
        
        data.append(row)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Display statistics
    print("=== Dataset Statistics ===")
    print(f"Total samples: {len(df)}")
    print(f"\nYield statistics:")
    print(df['yield_kg_per_plant'].describe())
    print(f"\nSoil suitability distribution:")
    print(df['soil_suitability'].value_counts())
    print(f"\nSoil type distribution:")
    print(df['soil_type'].value_counts())
    print(f"\nWater availability distribution:")
    print(df['water_availability'].value_counts())
    print(f"\nCrop stage distribution:")
    print(df['crop_stage'].value_counts())
    
    return df


def save_training_data(df, filename='pepper_training_data.csv'):
    """
    Save training data to CSV file
    """
    # Create data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    filepath = os.path.join(data_dir, filename)
    df.to_csv(filepath, index=False)
    
    print(f"\n✓ Training data saved to: {filepath}")
    return filepath


if __name__ == "__main__":
    print("Generating pepper training data...\n")
    
    # Generate 2000 samples
    df = generate_pepper_training_data(n_samples=2000)
    
    # Save to CSV
    filepath = save_training_data(df)
    
    print("\n✓ Data generation completed successfully!")
    print(f"\nNext step: Run pepper_yield_predictor.py to train the models")
