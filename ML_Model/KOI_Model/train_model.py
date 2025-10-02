import pandas as pd
import numpy as np
import os
from preprocess import KOIDataPreprocessor
from sklearn.model_selection import train_test_split
import joblib
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import traceback

class KOIModel:
    def __init__(self):
        self.model = None
        self.is_trained = False
        
    def create_advanced_model(self):
        """Create an advanced ensemble model"""
        # Create multiple models for ensemble
        xgb = XGBClassifier(
            n_estimators=500,
            learning_rate=0.1,
            max_depth=8,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=0.1,
            eval_metric='mlogloss',
            random_state=42
        )
        
        rf = RandomForestClassifier(
            n_estimators=300,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        lr = LogisticRegression(
            C=1.0,
            max_iter=1000,
            random_state=42
        )
        
        # Create voting classifier
        self.model = VotingClassifier(
            estimators=[
                ('xgb', xgb),
                ('rf', rf),
                ('lr', lr)
            ],
            voting='soft',
            weights=[3, 2, 1]  # Give more weight to XGBoost
        )
        
    def train(self, X, y):
        """Train the model"""
        print("🚀 Training advanced ensemble model for KOI...")
        self.create_advanced_model()
        self.model.fit(X, y)
        self.is_trained = True
        print("✅ KOI Model training completed")
        
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("KOI Model not trained yet")
        
        predictions = self.model.predict(X)
        probabilities = self.model.predict_proba(X)
        
        return predictions, probabilities
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        y_pred, probabilities = self.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        class_report = classification_report(y_test, y_pred, output_dict=True)
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        return {
            'accuracy': accuracy,
            'classification_report': class_report,
            'confusion_matrix': conf_matrix.tolist(),
            'predictions': y_pred.tolist(),
            'probabilities': probabilities.tolist()
        }
    
    def save_model(self, file_path):
        """Save the trained model"""
        try:
            joblib.dump(self.model, file_path)
            print(f"✅ KOI Model saved to {file_path}")
        except Exception as e:
            print(f"❌ Error saving KOI model: {e}")
            raise
    
    def load_model(self, file_path):
        """Load a trained model"""
        self.model = joblib.load(file_path)
        self.is_trained = True
        print(f"✅ KOI Model loaded from {file_path}")

def train_koi_model(data_file_path):
    """Complete training pipeline for KOI model"""
    
    print("🎯 Starting KOI Model Training Pipeline...")
    print(f"📁 Using data file: {data_file_path}")
    
    try:
        # Check if data file exists
        if not os.path.exists(data_file_path):
            raise FileNotFoundError(f"KOI data file not found: {data_file_path}")
        
        # Initialize preprocessor
        preprocessor = KOIDataPreprocessor()
        
        # Preprocess data
        print("📊 Preprocessing KOI data...")
        X, y = preprocessor.preprocess_pipeline(data_file_path)
        
        # Split data
        print("✂️ Splitting data into train/test sets...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"📊 Training set: {X_train.shape[0]} samples")
        print(f"📊 Test set: {X_test.shape[0]} samples")
        
        # Train model
        print("🚀 Training advanced ensemble model...")
        model = KOIModel()
        model.train(X_train, y_train)
        
        # Evaluate model
        print("📈 Evaluating model performance...")
        evaluation = model.evaluate(X_test, y_test)
        
        # Save model and preprocessor
        print("💾 Saving model and preprocessor...")
        model.save_model('model.pkl')
        preprocessor.save_preprocessor('preprocessor.pkl')
        
        # Print results
        print("\n" + "="*60)
        print("🎉 KOI TRAINING COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"📊 Accuracy: {evaluation['accuracy']:.4f}")
        print(f"🎯 Classes: {preprocessor.label_encoder.classes_.tolist()}")
        print(f"🔧 Features used: {len(preprocessor.selected_features)}")
        print(f"📁 Model saved: model.pkl")
        print(f"🔧 Preprocessor saved: preprocessor.pkl")
        
        # Print detailed classification report
        print("\n📋 Detailed Classification Report:")
        class_report = evaluation['classification_report']
        for class_name in preprocessor.label_encoder.classes_:
            if class_name in class_report:
                metrics = class_report[class_name]
                print(f"   {class_name}:")
                print(f"     Precision: {metrics['precision']:.3f}")
                print(f"     Recall:    {metrics['recall']:.3f}")
                print(f"     F1-Score:  {metrics['f1-score']:.3f}")
                print(f"     Support:   {metrics['support']}")
        
        # Print confusion matrix
        print(f"\n🎯 Confusion Matrix:")
        conf_matrix = evaluation['confusion_matrix']
        for i, row in enumerate(conf_matrix):
            class_name = preprocessor.label_encoder.classes_[i]
            print(f"   {class_name}: {row}")
        
        return model, preprocessor, evaluation
        
    except Exception as e:
        print(f"❌ KOI Training failed: {e}")
        traceback.print_exc()
        raise

def analyze_koi_dataset(data_file_path):
    """Analyze the KOI dataset before training"""
    print("🔍 Analyzing KOI dataset...")
    
    try:
        # Read the data to understand its structure
        df = pd.read_csv(data_file_path, comment='#', nrows=5)
        print(f"📊 KOI Dataset columns: {len(df.columns)}")
        print(f"📊 Sample columns: {list(df.columns)[:10]}...")
        
        # Read full dataset for analysis
        df_full = pd.read_csv(data_file_path, comment='#')
        print(f"📊 Total rows: {len(df_full)}")
        print(f"📊 Total columns: {len(df_full.columns)}")
        
        # Check target column distribution
        target_columns = ['koi_disposition', 'koi_pdisposition']
        for target_col in target_columns:
            if target_col in df_full.columns:
                target_dist = df_full[target_col].value_counts()
                print(f"🎯 {target_col} distribution:")
                for value, count in target_dist.items():
                    print(f"   {value}: {count} samples ({count/len(df_full)*100:.1f}%)")
                break
        
        # Check for missing values in key columns
        key_columns = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 'koi_disposition']
        print(f"🔍 Missing values in key columns:")
        for col in key_columns:
            if col in df_full.columns:
                missing = df_full[col].isna().sum()
                print(f"   {col}: {missing} missing ({missing/len(df_full)*100:.1f}%)")
        
        return df_full
        
    except Exception as e:
        print(f"❌ KOI Dataset analysis failed: {e}")
        return None

if __name__ == "__main__":
    # Use the actual KOI data file
    data_file = "koi_data.csv"
    
    # First, analyze the dataset
    analyze_koi_dataset(data_file)
    
    print("\n" + "="*60)
    print("🚀 STARTING KOI MODEL TRAINING")
    print("="*60)
    
    # Train the model with the real data
    train_koi_model(data_file)