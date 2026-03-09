"""
BLACK PEPPER DISEASE DETECTION - CNN TRAINING SCRIPT
Train a CNN model to detect diseases in Black Pepper (Piper nigrum) leaves
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import os
import json
from pathlib import Path

class BlackPepperCNNTrainer:
    def __init__(self, dataset_path='black_pepper_dataset', model_name='black_pepper_disease_model.keras'):
        """Initialize the Black Pepper CNN trainer"""
        self.dataset_path = Path(dataset_path)
        self.model_name = model_name
        self.model = None
        self.history = None
        self.class_names = None
        
        # Image parameters
        self.img_height = 224
        self.img_width = 224
        self.batch_size = 32
        
        print("[*] Black Pepper Disease Detection - CNN Trainer Initialized")
        print(f"[*] Dataset path: {self.dataset_path}")
        print(f"[*] Model will be saved as: {self.model_name}")
    
    def verify_dataset(self):
        """Verify that the dataset exists and has the correct structure"""
        print("\n" + "="*70)
        print("📂 VERIFYING DATASET STRUCTURE")
        print("="*70)
        
        if not self.dataset_path.exists():
            print(f"❌ Dataset path not found: {self.dataset_path}")
            print(f"\n💡 Please create the dataset directory structure:")
            print(f"   {self.dataset_path}/")
            print(f"       train/")
            print(f"           healthy/")
            print(f"               image1.jpg")
            print(f"               image2.jpg")
            print(f"           bacterial_wilt/")
            print(f"               image1.jpg")
            print(f"           root_rot/")
            print(f"               image1.jpg")
            print(f"           leaf_spot/")
            print(f"               image1.jpg")
            print(f"       validation/")
            print(f"           healthy/")
            print(f"           bacterial_wilt/")
            print(f"           root_rot/")
            print(f"           leaf_spot/")
            return False
        
        # Check for train and validation directories
        train_dir = self.dataset_path / 'train'
        val_dir = self.dataset_path / 'validation'
        
        if not train_dir.exists():
            print(f"❌ Training directory not found: {train_dir}")
            return False
        
        if not val_dir.exists():
            print(f"⚠️ Validation directory not found. Will use 20% of training data for validation.")
        
        # List all disease classes found
        disease_classes = [d.name for d in train_dir.iterdir() if d.is_dir()]
        
        if len(disease_classes) == 0:
            print(f"❌ No disease class folders found in {train_dir}")
            return False
        
        print(f"\n✅ Found {len(disease_classes)} disease classes:")
        
        total_images = 0
        for disease in disease_classes:
            disease_path = train_dir / disease
            image_files = list(disease_path.glob('*.jpg')) + list(disease_path.glob('*.jpeg')) + \
                         list(disease_path.glob('*.png')) + list(disease_path.glob('*.JPG')) + \
                         list(disease_path.glob('*.PNG'))
            count = len(image_files)
            total_images += count
            print(f"   • {disease}: {count} images")
        
        print(f"\n✅ Total training images: {total_images}")
        
        if total_images < 100:
            print(f"\n⚠️ WARNING: You only have {total_images} images. For good results, you need:")
            print(f"   • Minimum: 100+ images per class")
            print(f"   • Recommended: 500+ images per class")
            print(f"   • Good: 1000+ images per class")
        
        return True
    
    def create_model(self, num_classes):
        """Create a CNN model using transfer learning with MobileNetV2"""
        print("\n" + "="*70)
        print("🏗️ BUILDING CNN MODEL")
        print("="*70)
        
        # Load pre-trained MobileNetV2 model (trained on ImageNet)
        base_model = keras.applications.MobileNetV2(
            input_shape=(self.img_height, self.img_width, 3),
            include_top=False,
            weights='imagenet'
        )
        
        # Freeze the base model
        base_model.trainable = False
        
        # Create the model
        inputs = keras.Input(shape=(self.img_height, self.img_width, 3))
        
        # Pre-processing
        x = keras.applications.mobilenet_v2.preprocess_input(inputs)
        
        # Base model
        x = base_model(x, training=False)
        
        # Pooling and classification layers
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.2)(x)
        outputs = layers.Dense(num_classes, activation='softmax')(x)
        
        model = keras.Model(inputs, outputs)
        
        # Compile the model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print(f"✅ Model created with {num_classes} output classes")
        print(f"   Total parameters: {model.count_params():,}")
        
        self.model = model
        return model
    
    def prepare_data(self):
        """Prepare data generators for training"""
        print("\n" + "="*70)
        print("📊 PREPARING DATA")
        print("="*70)
        
        train_dir = self.dataset_path / 'train'
        val_dir = self.dataset_path / 'validation'
        
        # Data augmentation for training
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            vertical_flip=True,
            fill_mode='nearest',
            validation_split=0.2 if not val_dir.exists() else 0.0
        )
        
        # Validation data (only rescaling)
        val_datagen = ImageDataGenerator(rescale=1./255)
        
        # Training data generator
        if not val_dir.exists():
            # Use split from training data
            train_generator = train_datagen.flow_from_directory(
                train_dir,
                target_size=(self.img_height, self.img_width),
                batch_size=self.batch_size,
                class_mode='categorical',
                subset='training'
            )
            
            validation_generator = train_datagen.flow_from_directory(
                train_dir,
                target_size=(self.img_height, self.img_width),
                batch_size=self.batch_size,
                class_mode='categorical',
                subset='validation'
            )
        else:
            # Use separate validation directory
            train_datagen_no_split = ImageDataGenerator(
                rescale=1./255,
                rotation_range=20,
                width_shift_range=0.2,
                height_shift_range=0.2,
                shear_range=0.2,
                zoom_range=0.2,
                horizontal_flip=True,
                vertical_flip=True,
                fill_mode='nearest'
            )
            
            train_generator = train_datagen_no_split.flow_from_directory(
                train_dir,
                target_size=(self.img_height, self.img_width),
                batch_size=self.batch_size,
                class_mode='categorical'
            )
            
            validation_generator = val_datagen.flow_from_directory(
                val_dir,
                target_size=(self.img_height, self.img_width),
                batch_size=self.batch_size,
                class_mode='categorical'
            )
        
        # Store class names
        self.class_names = {v: k for k, v in train_generator.class_indices.items()}
        
        print(f"✅ Training samples: {train_generator.samples}")
        print(f"✅ Validation samples: {validation_generator.samples}")
        print(f"✅ Classes: {list(self.class_names.values())}")
        
        return train_generator, validation_generator
    
    def train(self, epochs=30):
        """Train the model"""
        print("\n" + "="*70)
        print("🚀 STARTING TRAINING")
        print("="*70)
        
        # Prepare data
        train_generator, validation_generator = self.prepare_data()
        
        # Create model
        num_classes = len(self.class_names)
        self.create_model(num_classes)
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=5,
                restore_best_weights=True,
                verbose=1
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.2,
                patience=3,
                min_lr=0.00001,
                verbose=1
            ),
            keras.callbacks.ModelCheckpoint(
                f'models/checkpoint_{self.model_name}',
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            )
        ]
        
        # Train the model
        print(f"\n⏳ Training for {epochs} epochs...")
        print(f"   (Training will stop early if validation loss doesn't improve)\n")
        
        history = self.model.fit(
            train_generator,
            validation_data=validation_generator,
            epochs=epochs,
            callbacks=callbacks,
            verbose=1
        )
        
        self.history = history
        
        # Print final results
        print("\n" + "="*70)
        print("✅ TRAINING COMPLETE!")
        print("="*70)
        
        final_accuracy = history.history['accuracy'][-1] * 100
        final_val_accuracy = history.history['val_accuracy'][-1] * 100
        
        print(f"Final Training Accuracy: {final_accuracy:.2f}%")
        print(f"Final Validation Accuracy: {final_val_accuracy:.2f}%")
        
        return history
    
    def save_model(self):
        """Save the trained model"""
        print("\n" + "="*70)
        print("💾 SAVING MODEL")
        print("="*70)
        
        # Create models directory if it doesn't exist
        models_dir = Path('models')
        models_dir.mkdir(exist_ok=True)
        
        # Save the model
        model_path = models_dir / self.model_name
        self.model.save(model_path)
        print(f"✅ Model saved: {model_path}")
        
        # Save class indices
        class_indices_path = models_dir / 'black_pepper_class_indices.json'
        with open(class_indices_path, 'w') as f:
            json.dump({v: k for k, v in self.class_names.items()}, f, indent=2)
        print(f"✅ Class indices saved: {class_indices_path}")
        
        print(f"\n📋 To use this model:")
        print(f"   1. Update cnn_disease_detector_v3.py model path to: '{model_path}'")
        print(f"   2. Update class_indices.json path to: '{class_indices_path}'")
        print(f"   3. Restart the Disease Detection API")
    
    def evaluate_model(self, test_dir=None):
        """Evaluate the model on test data"""
        if test_dir is None:
            test_dir = self.dataset_path / 'test'
        
        if not test_dir.exists():
            print(f"\n⚠️ Test directory not found: {test_dir}")
            print(f"   Skipping evaluation.")
            return
        
        print("\n" + "="*70)
        print("📊 EVALUATING MODEL ON TEST DATA")
        print("="*70)
        
        test_datagen = ImageDataGenerator(rescale=1./255)
        
        test_generator = test_datagen.flow_from_directory(
            test_dir,
            target_size=(self.img_height, self.img_width),
            batch_size=self.batch_size,
            class_mode='categorical',
            shuffle=False
        )
        
        results = self.model.evaluate(test_generator, verbose=1)
        
        print(f"\n✅ Test Results:")
        print(f"   Loss: {results[0]:.4f}")
        print(f"   Accuracy: {results[1]*100:.2f}%")

def main():
    """Main training function"""
    print("\n" + "="*70)
    print("🌿 BLACK PEPPER DISEASE DETECTION - CNN TRAINING")
    print("="*70)
    print("\nThis script will train a CNN model to detect diseases in Black Pepper leaves")
    print("Common Black Pepper diseases:")
    print("  • Healthy (no disease)")
    print("  • Bacterial Wilt (Ralstonia solanacearum)")
    print("  • Phytophthora Foot Rot")
    print("  • Anthracnose (Colletotrichum)")
    print("  • Yellow Leaf Disease")
    print("  • Stunted Disease")
    
    # Initialize trainer
    trainer = BlackPepperCNNTrainer(
        dataset_path='black_pepper_dataset',
        model_name='black_pepper_disease_model.keras'
    )
    
    # Verify dataset
    if not trainer.verify_dataset():
        print("\n❌ Dataset verification failed. Please fix the issues and try again.")
        return
    
    # Ask user to confirm
    print("\n" + "="*70)
    response = input("📝 Do you want to start training? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("Training cancelled.")
        return
    
    # Train the model
    trainer.train(epochs=30)
    
    # Save the model
    trainer.save_model()
    
    # Evaluate if test data exists
    trainer.evaluate_model()
    
    print("\n" + "="*70)
    print("🎉 ALL DONE!")
    print("="*70)
    print("\nYour Black Pepper disease detection model is ready!")
    print("Update the disease_detection_api.py to use this new model.")

if __name__ == "__main__":
    main()
