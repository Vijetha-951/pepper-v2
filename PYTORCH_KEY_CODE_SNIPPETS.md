# 🔑 Key Code Snippets - Study Guide

## Quick Reference for PyTorch Integration

---

## 1️⃣ PyTorch Model Architecture

```python
# File: pytorch_black_pepper_detector.py

class EfficientNetB0BlackPepper(nn.Module):
    """Your trained model structure"""
    def __init__(self, num_classes=5):
        super().__init__()
        
        # Import EfficientNet backbone
        from torchvision.models import efficientnet_b0
        self.model = efficientnet_b0(weights=None)  # No pretrained weights
        
        # Replace final classifier
        in_features = self.model.classifier[1].in_features  # Usually 1280
        self.model.classifier = nn.Sequential(
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(in_features, num_classes)  # 1280 -> 5
        )
    
    def forward(self, x):
        return self.model(x)  # Returns logits [batch_size, 5]
```

**Study Points:**
- `weights=None` = Start from scratch (no ImageNet weights)
- Classifier replacement maintains dropout rate from training
- Forward pass returns raw logits (not probabilities)

---

## 2️⃣ Model Loading

```python
# File: pytorch_black_pepper_detector.py

def _load_model(self, model_path):
    """Load your trained weights"""
    
    # 1. Create model architecture
    model = EfficientNetB0BlackPepper(num_classes=5)
    
    # 2. Load checkpoint file
    checkpoint = torch.load(model_path, map_location=self.device)
    # map_location='cpu' ensures it works without GPU
    
    # 3. Extract state dict (handles different save formats)
    if isinstance(checkpoint, dict):
        if 'model_state_dict' in checkpoint:
            state_dict = checkpoint['model_state_dict']
        else:
            state_dict = checkpoint
    else:
        state_dict = checkpoint
    
    # 4. Load weights (strict=False allows partial loading)
    try:
        model.load_state_dict(state_dict)
        print("[OK] Full model loaded!")
    except Exception as e:
        model.load_state_dict(state_dict, strict=False)
        print("[OK] Partial model loaded")
    
    # 5. Set to evaluation mode
    model.eval()
    return model
```

**Study Points:**
- `torch.load()` deserializes `.pth` file
- `strict=False` ignores mismatched keys (allows partial loads)
- `model.eval()` disables dropout and batch norm training mode

---

## 3️⃣ Image Preprocessing

```python
# File: pytorch_black_pepper_detector.py

# Define transform pipeline (matches your Colab training)
self.transform = transforms.Compose([
    transforms.Resize((224, 224)),           # Resize to EfficientNet input
    transforms.ToTensor(),                   # Convert PIL -> Tensor, scale [0,255] -> [0,1]
    transforms.Normalize(                    # ImageNet normalization
        mean=[0.485, 0.456, 0.406],         # R, G, B channel means
        std=[0.229, 0.224, 0.225]           # R, G, B channel std devs
    )
])

# Apply transform during prediction
image = Image.open(image_path).convert('RGB')  # Ensure RGB format
image_tensor = self.transform(image)            # Apply transforms
image_tensor = image_tensor.unsqueeze(0)        # Add batch dimension [3,224,224] -> [1,3,224,224]
```

**Study Points:**
- `PIL.Image.open()` loads image file
- `.convert('RGB')` handles RGBA or grayscale images
- `.unsqueeze(0)` adds batch dimension (model expects batches)
- ImageNet normalization is standard for transfer learning

---

## 4️⃣ Inference (Prediction)

```python
# File: pytorch_black_pepper_detector.py

def predict(self, image_path):
    """Make prediction on image"""
    
    # 1. Load and preprocess
    image = Image.open(image_path).convert('RGB')
    image_tensor = self.transform(image).unsqueeze(0).to(self.device)
    
    # 2. Forward pass (no gradient computation needed)
    with torch.no_grad():
        outputs = self.model(image_tensor)           # Shape: [1, 5] (logits)
        probabilities = torch.softmax(outputs, dim=1)  # Convert to probabilities
        confidence, predicted_idx = torch.max(probabilities, 1)  # Get max probability
    
    # 3. Extract values
    predicted_idx = predicted_idx.item()      # Tensor -> Python int
    confidence = confidence.item() * 100      # Tensor -> Python float, scale to percentage
    
    # 4. Map index to class name
    predicted_class = self.class_names[predicted_idx]  # e.g., "black_pepper_healthy"
    
    # 5. Format for display
    formatted_name = predicted_class.replace('_', ' ').title()  # "Black Pepper Healthy"
    
    # 6. Build result dictionary
    return {
        'success': True,
        'disease': formatted_name,
        'confidence': round(confidence, 2),
        'model_framework': 'pytorch',
        'all_predictions': {
            self.class_names[i].replace('_', ' ').title(): 
            float(probabilities[0][i] * 100)
            for i in range(len(probabilities[0]))
        }
    }
```

**Study Points:**
- `torch.no_grad()` disables gradient tracking (faster inference)
- `torch.softmax(dim=1)` converts logits to probabilities (sum to 1.0)
- `torch.max()` returns (value, index) tuple
- `.item()` extracts scalar value from single-element tensor

---

## 5️⃣ Auto-Detection in Orchestrator

```python
# File: dual_model_detector.py

class DualModelDetector:
    def __init__(self):
        """Auto-detect PyTorch model on startup"""
        self.using_pytorch = False
        self.pytorch_detector = None
        
        # Check if PyTorch model exists
        pytorch_path = 'best_black_pepper_model.pth'
        if os.path.exists(pytorch_path):
            print("[*] Found PyTorch model!")
            
            # Import and initialize PyTorch detector
            from pytorch_black_pepper_detector import get_detector
            self.pytorch_detector = get_detector()
            self.using_pytorch = True
            
            print("[OK] Using trained PyTorch model!")
        else:
            print("[*] PyTorch model not found, using Keras fallback")
    
    def predict(self, image_path, model_type='black_pepper'):
        """Route to appropriate model"""
        
        # Validate image first
        is_valid, reason, _ = self.is_valid_plant_image(image_path)
        if not is_valid:
            return {'success': False, 'message': reason}
        
        # Route to PyTorch if available
        if model_type == 'black_pepper' and self.using_pytorch:
            return self.pytorch_detector.predict(image_path)
        
        # Fallback to Keras
        return self._predict_keras(image_path)
```

**Study Points:**
- `os.path.exists()` checks if file is present
- Dynamic import with `from ... import ...` 
- Fallback pattern ensures system always works

---

## 6️⃣ Image Validation (Anti-Fake System)

```python
# File: dual_model_detector.py

def is_valid_plant_image(self, image_path):
    """Validate image contains actual pepper leaf"""
    
    # 1. Load image
    img = cv2.imread(image_path)
    img_resized = cv2.resize(img, (256, 256))
    hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
    
    total_pixels = 256 * 256
    
    # 2. Detect green (healthy leaves)
    green_lower = np.array([35, 20, 20])   # HSV range for green
    green_upper = np.array([90, 255, 255])
    green_mask = cv2.inRange(hsv, green_lower, green_upper)
    green_pct = (np.sum(green_mask > 0) / total_pixels) * 100
    
    # 3. Detect yellow/brown (diseased leaves)
    yellow_lower = np.array([10, 20, 20])
    yellow_upper = np.array([35, 255, 255])
    yellow_mask = cv2.inRange(hsv, yellow_lower, yellow_upper)
    yellow_pct = (np.sum(yellow_mask > 0) / total_pixels) * 100
    
    plant_pct = green_pct + yellow_pct
    
    # 4. Reject if not enough plant content
    if plant_pct < 5:
        return False, "Not a pepper plant leaf!", 0
    
    # 5. Detect skin tones (reject photos of people)
    skin_lower = np.array([0, 20, 70])
    skin_upper = np.array([20, 150, 255])
    skin_mask = cv2.inRange(hsv, skin_lower, skin_upper)
    skin_pct = (np.sum(skin_mask > 0) / total_pixels) * 100
    
    if skin_pct > 45 and green_pct < 25:
        return False, "This is a photo of a person!", 0
    
    # 6. Detect blue (screenshots, sky, logos)
    blue_lower = np.array([90, 50, 50])
    blue_upper = np.array([130, 255, 255])
    blue_mask = cv2.inRange(hsv, blue_lower, blue_upper)
    blue_pct = (np.sum(blue_mask > 0) / total_pixels) * 100
    
    if blue_pct > 35:
        return False, "Looks like a screenshot or logo!", 0
    
    # 7. Calculate confidence
    confidence = min(100, plant_pct * 3.0)
    
    return True, "Valid pepper leaf", confidence
```

**Study Points:**
- HSV color space better for color detection than RGB
- `cv2.inRange()` creates binary mask for color range
- Multiple validation checks catch different fake types
- Returns tuple: (is_valid, reason, confidence)

---

## 7️⃣ Flask API Endpoint

```python
# File: disease_detection_api.py

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    
    # 1. Validate request
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image uploaded'}), 400
    
    # 2. Get file and metadata
    file = request.files['image']
    pepper_type = request.form.get('pepper_type', 'black_pepper')
    
    # 3. Save file
    filename = secure_filename(f"{int(time.time())}_{file.filename}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # 4. Predict
    result = detector.predict(filepath, model_type=pepper_type)
    
    # 5. Add disease information
    if result.get('success'):
        disease = result['disease']
        result['description'] = get_disease_description(disease)
        result['severity'] = get_disease_severity(disease)
        result['treatment'] = get_disease_treatment(disease)
        result['prevention'] = get_disease_prevention(disease)
    
    # 6. Return JSON response
    return jsonify({
        'success': result.get('success', True),
        'prediction': result,
        'timestamp': datetime.now().isoformat(),
        'model_info': {
            'framework': 'PyTorch' if detector.using_pytorch else 'TensorFlow',
            'architecture': 'EfficientNet-B0'
        }
    })
```

**Study Points:**
- `request.files` accesses uploaded files
- `request.form` accesses form data
- `secure_filename()` prevents path traversal attacks
- `jsonify()` converts dict to JSON response with proper headers

---

## 8️⃣ Node.js Service (API Gateway)

```javascript
// File: diseaseDetectionService.js

async predictFromFile(imagePath, metadata = {}) {
  // Create multipart form data
  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));
  formData.append('pepper_type', metadata.pepper_type || 'black_pepper');
  
  // POST to Python API
  const response = await axios.post(
    'http://localhost:5001/predict',
    formData,
    {
      timeout: 30000,  // 30 second timeout
      headers: formData.getHeaders()  // Multipart headers
    }
  );
  
  return response.data;  // Returns Flask JSON response
}
```

**Study Points:**
- `FormData` creates multipart/form-data request
- `fs.createReadStream()` streams file without loading into memory
- `axios.post()` makes HTTP request to Python API
- `.getHeaders()` automatically sets Content-Type boundary

---

## 9️⃣ React Frontend Upload

```javascript
// File: DiseaseDetection.jsx

const handleAnalyze = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Call service
    const result = await diseaseDetectionService.detectDisease(
      selectedImage,  // File object from input
      {
        pepperType: 'black_pepper',
        notes: metadata.notes
      }
    );
    
    // Handle response
    if (result.success) {
      setPrediction(result.prediction);
      loadHistory();  // Refresh history
    } else {
      setError(result.message || 'Prediction failed');
    }
  } catch (err) {
    setError('Network error: ' + err.message);
  } finally {
    setLoading(false);
  }
};
```

**Study Points:**
- `async/await` for cleaner async code
- `try/catch/finally` for error handling
- State updates with `setPrediction()`, `setError()`
- Service abstraction separates UI from API logic

---

## 🔟 Class Indices JSON

```json
// File: models/black_pepper_class_indices.json

{
  "black_pepper_footrot": 0,
  "black_pepper_healthy": 1,
  "black_pepper_not_pepper_leaf": 2,
  "black_pepper_pollu_disease": 3,
  "black_pepper_slow_decline": 4
}
```

**Used by:**
```python
# Load class mapping
with open('models/black_pepper_class_indices.json', 'r') as f:
    class_indices = json.load(f)

# Reverse mapping: index -> name
self.class_names = {v: k for k, v in class_indices.items()}
# Result: {0: "black_pepper_footrot", 1: "black_pepper_healthy", ...}

# Use during prediction
predicted_class = self.class_names[predicted_idx]  # e.g., predicted_idx=3 -> "black_pepper_pollu_disease"
```

---

## 📊 Complete Prediction Flow

```python
# STEP-BY-STEP PREDICTION EXAMPLE

# 1. User uploads image -> React frontend
<input type="file" onChange={handleImageSelect} />

# 2. React calls Node.js API
const result = await diseaseDetectionService.detectDisease(file, metadata)

# 3. Node.js proxies to Flask
axios.post('http://localhost:5001/predict', formData)

# 4. Flask saves and calls detector
detector.predict(filepath, model_type='black_pepper')

# 5. Orchestrator routes to PyTorch
if self.using_pytorch:
    return self.pytorch_detector.predict(image_path)

# 6. PyTorch processes
image = Image.open(image_path).convert('RGB')
tensor = transform(image).unsqueeze(0)

# 7. Model inference
with torch.no_grad():
    outputs = model(tensor)  # [1, 5]
    probs = torch.softmax(outputs, dim=1)  # Convert to probabilities

# 8. Extract prediction
confidence, idx = torch.max(probs, 1)
predicted_class = class_names[idx.item()]  # "black_pepper_pollu_disease"

# 9. Format and return
return {
    'disease': 'Black Pepper Pollu Disease',
    'confidence': 85.42,
    'all_predictions': {...}
}

# 10. Flask adds disease info
result['description'] = "Pollu beetle infestation..."
result['treatment'] = ["Remove affected leaves", ...]

# 11. Returns to Node.js -> React -> User UI
```

---

## 🎯 Key Concepts Summary

| Concept | Code | Purpose |
|---------|------|---------|
| **Model Architecture** | `EfficientNetB0BlackPepper(nn.Module)` | Define neural network structure |
| **State Dict** | `torch.load('model.pth')` | Load trained weights |
| **Preprocessing** | `transforms.Compose([...])` | Prepare image for model input |
| **Inference** | `with torch.no_grad(): outputs = model(x)` | Get predictions without gradients |
| **Softmax** | `torch.softmax(outputs, dim=1)` | Convert logits to probabilities |
| **Auto-Detection** | `if os.path.exists('model.pth'):` | Choose best available model |
| **Image Validation** | `cv2.inRange(hsv, lower, upper)` | Detect colors in HSV space |
| **API Gateway** | `axios.post(apiUrl, formData)` | Proxy between frontend and Python |

---

## 📚 Next Steps to Study

1. **Experiment with preprocessing:**
   - Try different image sizes
   - Test with different normalizations
   - See how it affects predictions

2. **Understand model loading:**
   - Practice loading different checkpoint formats
   - Learn about `strict` vs `strict=False`

3. **Trace data transformations:**
   - Print tensor shapes at each step
   - Visualize normalized images
   - Compare input vs preprocessed

4. **Modify validation rules:**
   - Adjust color thresholds
   - Add new rejection criteria
   - Test with edge cases

5. **Study error handling:**
   - See how errors propagate
   - Learn try/except patterns
   - Handle different failure modes

---

**📖 This guide contains all the key code patterns you need to understand the complete PyTorch disease detection system!**
