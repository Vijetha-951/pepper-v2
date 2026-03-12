"""
PyTorch Black Pepper Disease Detector
Direct integration of trained PyTorch EfficientNet model
"""
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import efficientnet_b0
from PIL import Image
import os


class EfficientNetB0BlackPepper(nn.Module):
    """EfficientNet-B0 for Black Pepper Disease Detection - EXACT training architecture"""
    def __init__(self, num_classes=5):
        super(EfficientNetB0BlackPepper, self).__init__()
        
        # Load EfficientNet-B0 WITHOUT wrapper - this matches training format
        # Training saved model directly, not wrapped in self.model
        base_model = efficientnet_b0(weights=None)
        
        # Copy all attributes directly to self (no wrapper)
        self.features = base_model.features
        self.avgpool = base_model.avgpool
        self.classifier = base_model.classifier
        
        # CRITICAL: Only replace classifier[1], NOT the entire classifier
        # This matches the exact training architecture
        in_features = self.classifier[1].in_features  # Should be 1280
        self.classifier[1] = nn.Linear(in_features, num_classes)
    
    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x


class PyTorchBlackPepperDetector:
    """Detector using trained PyTorch model"""
    
    # EXACT class names from training - DO NOT MODIFY
    CLASS_NAMES = ['Footrot', 'Healthy', 'Not_Pepper_Leaf', 'Pollu_Disease', 'Slow-Decline']
    
    def __init__(self, model_path='best_black_pepper_model.pth'):
        print(f"[*] Initializing PyTorch Black Pepper Detector...")
        
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[*] Using device: {self.device}")
        
        # Use hardcoded class names (matches training exactly)
        self.class_names = self.CLASS_NAMES
        self.num_classes = len(self.class_names)
        print(f"[*] Classes: {self.class_names}")
        
        # Load model
        self.model = self._load_model(model_path)
        
        # Define preprocessing - EXACT match to training
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
        
        print(f"[OK] PyTorch Black Pepper Detector ready!")
    
    def _load_model(self, model_path):
        """Load trained PyTorch model"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        print(f"[*] Loading trained model from: {model_path}")
        
        # Create model with EXACT architecture from training
        model = EfficientNetB0BlackPepper(num_classes=self.num_classes)
        
        # Load weights
        checkpoint = torch.load(model_path, map_location=self.device)
        
        # Handle different checkpoint formats
        if isinstance(checkpoint, dict):
            if 'model_state_dict' in checkpoint:
                state_dict = checkpoint['model_state_dict']
                epoch = checkpoint.get('epoch', 'unknown')
                accuracy = checkpoint.get('accuracy', checkpoint.get('best_acc', 'unknown'))
                print(f"[*] Model from epoch {epoch}, accuracy: {accuracy}")
            elif 'state_dict' in checkpoint:
                state_dict = checkpoint['state_dict']
            else:
                state_dict = checkpoint
        else:
            state_dict = checkpoint
        
        # Load state dict (should match exactly now)
        model.load_state_dict(state_dict, strict=True)
        print(f"[OK] Trained weights loaded successfully!")
        
        model.to(self.device)
        model.eval()
        return model
    
    def predict(self, image_path):
        """
        Predict disease from image
        Returns dict compatible with the API format
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Predict
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]  # Get first batch item
            
            # Convert to numpy for easier manipulation
            probs_np = probabilities.cpu().numpy()
            
            # NOT_PEPPER_LEAF threshold logic
            # Index 2 is Not_Pepper_Leaf
            if probs_np[2] == probs_np.max() and probs_np[2] < 0.85:
                # Set Not_Pepper_Leaf probability to 0 and pick next highest
                probs_np[2] = 0.0
                predicted_idx = probs_np.argmax()
                confidence = float(probs_np[predicted_idx] * 100)
            else:
                predicted_idx = probs_np.argmax()
                confidence = float(probs_np[predicted_idx] * 100)
            
            # Get predicted class name (exact string from CLASS_NAMES)
            predicted_class = self.class_names[predicted_idx]
            
            # Build all predictions dict with exact class names
            all_probabilities = {
                self.class_names[i]: float(probs_np[i] * 100)
                for i in range(len(self.class_names))
            }
            
            # Build result
            result = {
                'success': True,
                'disease': predicted_class,
                'confidence': round(confidence, 2),
                'all_predictions': all_probabilities,
                'model_framework': 'pytorch',
                'model_architecture': 'EfficientNet-B0'
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': f'Failed to process image: {str(e)}'
            }


# Singleton instance
_detector_instance = None

def get_detector():
    """Get or create singleton detector instance"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = PyTorchBlackPepperDetector()
    return _detector_instance


def test_model_loading():
    """Test that model loads correctly with exact class names"""
    print("\n" + "="*60)
    print("TESTING MODEL LOADING")
    print("="*60)
    
    detector = PyTorchBlackPepperDetector()
    
    print("\n[TEST] Class names verification:")
    print(f"Classes loaded: {detector.class_names}")
    print(f"Expected:       ['Footrot', 'Healthy', 'Not_Pepper_Leaf', 'Pollu_Disease', 'Slow-Decline']")
    
    match = detector.class_names == ['Footrot', 'Healthy', 'Not_Pepper_Leaf', 'Pollu_Disease', 'Slow-Decline']
    print(f"Match: {match}")
    
    if match:
        print("\n✅ TEST PASSED: Class names match exactly!")
    else:
        print("\n❌ TEST FAILED: Class names mismatch!")
        print(f"   Got:      {detector.class_names}")
        print(f"   Expected: ['Footrot', 'Healthy', 'Not_Pepper_Leaf', 'Pollu_Disease', 'Slow-Decline']")
    
    print("\n[TEST] Model architecture verification:")
    print(f"Number of classes: {detector.num_classes}")
    print(f"Expected: 5")
    print(f"Match: {detector.num_classes == 5}")
    
    print("\n[TEST] Model state:")
    print(f"Device: {detector.device}")
    print(f"Model in eval mode: {not detector.model.training}")
    
    print("="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")


if __name__ == '__main__':
    test_model_loading()
