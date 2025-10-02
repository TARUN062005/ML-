import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.model_selection import cross_val_score
import traceback

class CustomModel:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.model_info = {}
        self.training_history = {}
        
    def create_model(self, model_type='ensemble', params=None):
        """Create a model based on user preference"""
        print(f"🔧 Creating {model_type} model...")
        
        if params is None:
            params = {}
        
        if model_type == 'xgboost':
            self.model = XGBClassifier(
                n_estimators=params.get('n_estimators', 200),
                learning_rate=params.get('learning_rate', 0.1),
                max_depth=params.get('max_depth', 6),
                subsample=params.get('subsample', 0.8),
                colsample_bytree=params.get('colsample_bytree', 0.8),
                random_state=42,
                eval_metric='mlogloss'
            )
            
        elif model_type == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=params.get('n_estimators', 200),
                max_depth=params.get('max_depth', 10),
                min_samples_split=params.get('min_samples_split', 5),
                min_samples_leaf=params.get('min_samples_leaf', 2),
                random_state=42
            )
            
        elif model_type == 'logistic':
            self.model = LogisticRegression(
                C=params.get('C', 1.0),
                max_iter=params.get('max_iter', 1000),
                random_state=42
            )
            
        else:  # ensemble (default)
            xgb = XGBClassifier(
                n_estimators=200,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            rf = RandomForestClassifier(
                n_estimators=200,
                max_depth=10,
                random_state=42
            )
            
            lr = LogisticRegression(
                C=1.0,
                max_iter=1000,
                random_state=42
            )
            
            self.model = VotingClassifier(
                estimators=[
                    ('xgb', xgb),
                    ('rf', rf),
                    ('lr', lr)
                ],
                voting='soft'
            )
        
        self.model_info = {
            'model_type': model_type,
            'parameters': params,
            'created_at': pd.Timestamp.now().isoformat()
        }
        
        print(f"✅ {model_type.capitalize()} model created successfully")
    
    def train(self, X, y, validation_data=None):
        """Train the model"""
        print("🚀 Training custom model...")
        
        if self.model is None:
            self.create_model()  # Default to ensemble
        
        # Train the model
        self.model.fit(X, y)
        self.is_trained = True
        
        # Store training info
        self.training_history = {
            'trained_at': pd.Timestamp.now().isoformat(),
            'training_samples': len(X),
            'num_features': X.shape[1],
            'num_classes': len(np.unique(y))
        }
        
        print("✅ Custom model training completed")
        
        # Cross-validation score
        try:
            cv_scores = cross_val_score(self.model, X, y, cv=5, scoring='accuracy')
            self.training_history['cv_accuracy'] = {
                'mean': float(cv_scores.mean()),
                'std': float(cv_scores.std()),
                'scores': cv_scores.tolist()
            }
            print(f"📊 Cross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        except Exception as e:
            print(f"⚠️  Cross-validation failed: {e}")
    
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("Custom Model not trained yet")
        
        predictions = self.model.predict(X)
        
        # Get probabilities if available
        try:
            probabilities = self.model.predict_proba(X)
        except:
            probabilities = None
        
        return predictions, probabilities
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        y_pred, probabilities = self.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        class_report = classification_report(y_test, y_pred, output_dict=True)
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        evaluation = {
            'accuracy': accuracy,
            'classification_report': class_report,
            'confusion_matrix': conf_matrix.tolist(),
            'predictions': y_pred.tolist()
        }
        
        if probabilities is not None:
            evaluation['probabilities'] = probabilities.tolist()
        
        return evaluation
    
    def get_model_summary(self):
        """Get model summary information"""
        return {
            'is_trained': self.is_trained,
            'model_info': self.model_info,
            'training_history': self.training_history
        }
    
    def save_model(self, file_path):
        """Save the trained model"""
        try:
            model_data = {
                'model': self.model,
                'model_info': self.model_info,
                'training_history': self.training_history,
                'is_trained': self.is_trained
            }
            joblib.dump(model_data, file_path)
            print(f"✅ Custom Model saved to {file_path}")
        except Exception as e:
            print(f"❌ Error saving custom model: {e}")
            raise
    
    def load_model(self, file_path):
        """Load a trained model"""
        model_data = joblib.load(file_path)
        self.model = model_data['model']
        self.model_info = model_data['model_info']
        self.training_history = model_data['training_history']
        self.is_trained = model_data['is_trained']
        print(f"✅ Custom Model loaded from {file_path}")