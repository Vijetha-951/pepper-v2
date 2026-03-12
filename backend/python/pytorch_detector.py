"""
PyTorch Black Pepper Disease Detector
Wrapper to use PyTorch .pth model alongside TensorFlow models
"""
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import numpy as np
import os
import json


class PyTorchBlackPepperDetector:
    """
    Detector class that loads and uses PyTorch model
    Compatible with existing disease detection API
    """
    
    def __init__(self, model_path='best_black_pepper_model.pth', 
                 class_file='models/black_pepper_class_indices.json',
                 architecture='auto'):
        """
        Initialize PyTorch detector
        
        Args:
            model_path: Path to .pth model file
            class_file: Path to class names JSON
            architecture: 'auto', 'custom', 'mobilenet', 'resnet18'
        """
        print(f"[*] Initializing PyTorch Black Pepper Detector...")
        
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[*] Using device: {self.device}")
        
        # Load class names
        if os.path.exists(class_file):
            with open(class_file, 'r') as f:
                class_indices = json.load(f)
            self.class_names = {v: k for k, v in class_indices.items()}
            self.num_classes = len(self.class_names)
        else:
            print(f"[!] Warning: {class_file} not found, using default classes")
            self.class_names = {
                0: "black_pepper_healthy",
                1: "black_pepper_leaf_blight",
                2: "black_pepper_yellow_mottle_virus"
            }
            self.num_classes = 3
        
        # Load model
        self.model = self._load_model(model_path, architecture)
        
        # Define preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
        
        print(f"[OK] PyTorch detector initialized!")
        print(f"   Classes: {list(self.class_names.values())}")
    
    def _load_model(self, model_path, architecture):
        """Load PyTorch model"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        print(f"[*] Loading model from: {model_path}")
        
        # Load checkpoint
        checkpoint = torch.load(model_path, map_location=self.device)
        
        # Extract state dict
        if isinstance(checkpoint, dict):
            if 'model_state_dict' in checkpoint:
                state_dict = checkpoint['model_state_dict']
            elif 'state_dict' in checkpoint:
                state_dict = checkpoint['state_dict']
            else:
                state_dict = checkpoint
        else:
            state_dict = checkpoint
        
        # Detect architecture if needed
        if architecture == 'auto':
            architecture = self._detect_architecture(state_dict)
        
        print(f"[*] Architecture: {architecture}")
        
        # Create model
        if architecture == 'mobilenet':
            model = self._create_mobilenet_model()
        elif architecture == 'resnet18':
            model = self._create_resnet_model()
        else:
            model = self._create_custom_model()
        
        # Load weights
        try:
            model.load_state_dict(state_dict)
            print(f"[OK] Model loaded successfully!")
        except Exception as e:
            print(f"[!] Warning: {e}")
            model.load_state_dict(state_dict, strict=False)
            print(f"[OK] Model loaded (partial)")
        
        model.to(self.device)
        model.eval()
        return model
    
    def _detect_architecture(self, state_dict):
        """Detect model architecture from state dict"""
        keys = list(state_dict.keys())
        
        if any('mobilenet' in k.lower() or 'base_model.features' in k for k in keys):
            return 'mobilenet'
        elif any('resnet' in k.lower() or 'base_model.layer' in k for k in keys):
            return 'resnet18'
        
        return 'custom'
    
    def _create_custom_model(self):
        """Create custom CNN model"""
        class CustomCNN(nn.Module):
            def __init__(self, num_classes):
                super(CustomCNN, self).__init__()
                
                self.features = nn.Sequential(
                    nn.Conv2d(3, 32, kernel_size=3, padding=1),
                    nn.ReLU(inplace=True),
                    nn.MaxPool2d(kernel_size=2, stride=2),
                    
                    nn.Conv2d(32, 64, kernel_size=3, padding=1),
                    nn.ReLU(inplace=True),
                    nn.MaxPool2d(kernel_size=2, stride=2),
                    
                    nn.Conv2d(64, 128, kernel_size=3, padding=1),
                    nn.ReLU(inplace=True),
                    nn.MaxPool2d(kernel_size=2, stride=2),
                )
                
                self.classifier = nn.Sequential(
                    nn.AdaptiveAvgPool2d((7, 7)),
                    nn.Flatten(),
                    nn.Linear(128 * 7 * 7, 512),
                    nn.ReLU(inplace=True),
                    nn.Dropout(0.5),
                    nn.Linear(512, num_classes)
                )
            
            def forward(self, x):
                x = self.features(x)
                x = self.classifier(x)
                return x
        
        return CustomCNN(self.num_classes)
    
    def _create_mobilenet_model(self):
        """Create MobileNetV2-based model"""
        from torchvision import models
        
        class MobileNetV2Based(nn.Module):
            def __init__(self, num_classes):
                super(MobileNetV2Based, self).__init__()
                self.base_model = models.mobilenet_v2(pretrained=False)
                in_features = self.base_model.classifier[1].in_features
                self.base_model.classifier = nn.Sequential(
                    nn.Dropout(0.2),
                    nn.Linear(in_features, num_classes)
                )
            
            def forward(self, x):
                return self.base_model(x)
        
        return MobileNetV2Based(self.num_classes)
    
    def _create_resnet_model(self):
        """Create ResNet18-based model"""
        from torchvision import models
        
        class ResNet18Based(nn.Module):
            def __init__(self, num_classes):
                super(ResNet18Based, self).__init__()
                self.base_model = models.resnet18(pretrained=False)
                in_features = self.base_model.fc.in_features
                self.base_model.fc = nn.Linear(in_features, num_classes)
            
            def forward(self, x):
                return self.base_model(x)
        
        return ResNet18Based(self.num_classes)
    
    def predict(self, image_path):
        """
        Predict disease from image
        
        Args:
            image_path: Path to image file
        
        Returns:
            dict with prediction results (same format as TensorFlow detector)
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Predict
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted_idx = torch.max(probabilities, 1)
                
                predicted_idx = predicted_idx.item()
                confidence = confidence.item() * 100
            
            # Get class name
            raw_class_name = self.class_names[predicted_idx]
            predicted_class = self._format_class_name(raw_class_name)
            
            # Get all class probabilities
            all_probabilities = {
                self._format_class_name(self.class_names[i]): float(probabilities[0][i] * 100)
                for i in range(len(probabilities[0]))
            }
            
            # Build result (same format as TensorFlow detector)
            result = {
                'disease': predicted_class,
                'confidence': round(confidence, 2),
                'all_predictions': all_probabilities,
                'model_type': 'black_pepper',
                'model_framework': 'pytorch'
            }
            
            # Add warning for low confidence
            if confidence < 30:
                result['success'] = False
                result['warning_message'] = f'The model has low confidence ({round(confidence, 2)}%). The prediction may not be accurate.'
            else:
                result['success'] = True
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to process image'
            }
    
    def _format_class_name(self, raw_class_name):
        """Format class name for display"""
        # Convert 'black_pepper_healthy' -> 'Black Pepper Healthy'
        return ' '.join(word.capitalize() for word in raw_class_name.split('_'))


# ========================================
# TEST FUNCTION
# ========================================

def test_pytorch_detector():
    """Test PyTorch detector"""
    print("\n" + "="*60)
    print("Testing PyTorch Black Pepper Detector")
    print("="*60 + "\n")
    
    try:
        # Initialize detector
        detector = PyTorchBlackPepperDetector(
            model_path='best_black_pepper_model.pth',
            class_file='models/black_pepper_class_indices.json',
            architecture='auto'
        )
        
        # Test with an image (you need to provide a test image)
        test_image = "test_images/black_pepper_test.jpg"
        
        if not os.path.exists(test_image):
            print(f"\n⚠️  No test image found at: {test_image}")
            print(f"   Please provide a test image to verify the model works.")
            return
        
        print(f"\n[*] Testing with: {test_image}")
        result = detector.predict(test_image)
        
        print("\n" + "="*60)
        print("PREDICTION RESULT")
        print("="*60)
        print(json.dumps(result, indent=2))
        print("="*60 + "\n")
        
        if result['success']:
            print(f"✅ Model is working!")
            print(f"   Predicted: {result['disease']}")
            print(f"   Confidence: {result['confidence']}%")
        else:
            print(f"❌ Prediction failed: {result.get('message', 'Unknown error')}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_pytorch_detector()
