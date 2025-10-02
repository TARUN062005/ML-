from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from preprocess import K2DataPreprocessor
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Global variables for model and preprocessor
model = None
preprocessor = None
label_encoder = None

class K2Model:
    def __init__(self):
        self.model = None
        self.is_trained = False
        
    def create_advanced_model(self):
        """Create an advanced ensemble model"""
        from xgboost import XGBClassifier
        from sklearn.ensemble import RandomForestClassifier, VotingClassifier
        from sklearn.linear_model import LogisticRegression
        
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
            weights=[3, 2, 1]
        )
        
    def train(self, X, y):
        """Train the model"""
        print("🚀 Training advanced ensemble model for K2...")
        self.create_advanced_model()
        self.model.fit(X, y)
        self.is_trained = True
        print("✅ K2 Model training completed")
        
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("K2 Model not trained yet")
        
        predictions = self.model.predict(X)
        probabilities = self.model.predict_proba(X)
        
        return predictions, probabilities
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
        
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
        joblib.dump(self.model, file_path)
        print(f"✅ K2 Model saved to {file_path}")
    
    def load_model(self, file_path):
        """Load a trained model"""
        self.model = joblib.load(file_path)
        self.is_trained = True
        print(f"✅ K2 Model loaded from {file_path}")

def initialize_model():
    """Initialize or load the K2 model"""
    global model, preprocessor, label_encoder
    
    model_path = 'model.pkl'
    preprocessor_path = 'preprocessor.pkl'
    
    try:
        # Initialize preprocessor
        preprocessor = K2DataPreprocessor()
        
        # Try to load existing model and preprocessor
        if os.path.exists(model_path) and os.path.exists(preprocessor_path):
            model = K2Model()
            model.load_model(model_path)
            preprocessor.load_preprocessor(preprocessor_path)
            label_encoder = preprocessor.label_encoder
            print("✅ Pre-trained K2 model loaded successfully")
        else:
            model = K2Model()
            print("ℹ️ No pre-trained K2 model found. Train the model first.")
            
    except Exception as e:
        print(f"❌ Error initializing K2 model: {e}")
        model = K2Model()
        preprocessor = K2DataPreprocessor()

# Initialize model when app starts
initialize_model()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model.is_trained if model else False,
        'preprocessor_loaded': preprocessor is not None,
        'model_type': 'K2'
    })

@app.route('/train', methods=['POST'])
def train_model():
    """Train the K2 model"""
    global model, preprocessor, label_encoder
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file temporarily
        file_path = f"temp_k2_{file.filename}"
        file.save(file_path)
        
        # Initialize preprocessor
        preprocessor = K2DataPreprocessor()
        
        # Preprocess data
        X, y = preprocessor.preprocess_pipeline(file_path)
        
        # Split data
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train model
        model = K2Model()
        model.train(X_train, y_train)
        
        # Evaluate model
        evaluation = model.evaluate(X_test, y_test)
        
        # Save model and preprocessor
        model.save_model('model.pkl')
        preprocessor.save_preprocessor('preprocessor.pkl')
        label_encoder = preprocessor.label_encoder
        
        # Clean up
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': 'K2 Model trained successfully',
            'evaluation': evaluation,
            'class_names': label_encoder.classes_.tolist()
        })
        
    except Exception as e:
        print(f"❌ K2 Training error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Make predictions on single or multiple samples"""
    global model, preprocessor, label_encoder
    
    try:
        if not model or not model.is_trained:
            return jsonify({'error': 'K2 Model not trained. Please train the model first.'}), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Handle both single sample and batch predictions
        if isinstance(data, dict):
            samples = [data]
            is_batch = False
        elif isinstance(data, list):
            samples = data
            is_batch = True
        else:
            return jsonify({'error': 'Invalid data format. Expected object or array.'}), 400
        
        predictions = []
        
        for sample in samples:
            try:
                # Preprocess sample
                processed_sample = preprocessor.preprocess_single_sample(sample)
                
                # Make prediction
                pred_class, probabilities = model.predict(processed_sample)
                
                # Get class name and confidence
                class_idx = pred_class[0]
                class_name = label_encoder.inverse_transform([class_idx])[0]
                confidence = float(np.max(probabilities[0]))
                
                # Get all class probabilities
                class_probabilities = {}
                for i, class_label in enumerate(label_encoder.classes_):
                    class_probabilities[class_label] = float(probabilities[0][i])
                
                # Create explanation
                explanation = get_k2_prediction_explanation(class_name, confidence, sample)
                
                predictions.append({
                    'predicted_class': class_name,
                    'confidence': confidence,
                    'probabilities': class_probabilities,
                    'explanation': explanation,
                    'input_features': sample
                })
                
            except Exception as e:
                predictions.append({
                    'error': str(e),
                    'input_features': sample
                })
        
        response_data = {
            'success': True,
            'predictions': predictions
        }
        
        if not is_batch:
            response_data['prediction'] = predictions[0]
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ K2 Prediction error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/model_info', methods=['GET'])
def get_model_info():
    """Get information about the trained K2 model"""
    global model, preprocessor, label_encoder
    
    if not model or not model.is_trained:
        return jsonify({'error': 'K2 Model not trained'}), 400
    
    info = {
        'is_trained': model.is_trained,
        'model_type': 'K2',
        'feature_columns': preprocessor.feature_columns if preprocessor else [],
        'selected_features': preprocessor.selected_features if preprocessor else [],
        'class_names': label_encoder.classes_.tolist() if label_encoder else [],
        'target_column': preprocessor.target_column if preprocessor else '',
        'preprocessor_available': preprocessor is not None
    }
    
    return jsonify(info)

def get_k2_prediction_explanation(predicted_class, confidence, input_features):
    """Generate human-readable explanation for K2 prediction"""
    explanations = {
        'CONFIRMED': 'Confirmed Exoplanet - This object has been validated as a bona fide exoplanet through the K2 mission follow-up observations and statistical validation.',
        'CANDIDATE': 'Planetary Candidate - Strong evidence from K2 mission data suggests this is a planetary transit, but additional validation is required for confirmation.',
        'FALSE POSITIVE': 'False Positive - The detected signal is likely caused by instrumental effects, stellar variability, or astrophysical false positives rather than a genuine planetary transit in K2 data.'
    }
    
    base_explanation = explanations.get(predicted_class, 'Classification completed based on K2 mission transit characteristics.')
    
    # Add feature-based insights specific to K2 data
    insights = []
    
    if 'pl_rade' in input_features:
        radius = input_features['pl_rade']
        if radius > 20:
            insights.append("Very large planetary radius suggests gas giant.")
        elif radius < 2:
            insights.append("Small planetary radius suggests potentially rocky planet.")
    
    if 'pl_orbper' in input_features:
        period = input_features['pl_orbper']
        if period < 1:
            insights.append("Ultra-short orbital period typical of hot planets.")
        elif period > 100:
            insights.append("Long orbital period suggests distant orbit.")
    
    if 'pl_insol' in input_features:
        insol = input_features['pl_insol']
        if insol > 1000:
            insights.append("High insolation suggests close-in hot planet.")
        elif insol < 1:
            insights.append("Low insolation suggests cold distant planet.")
    
    if 'st_teff' in input_features:
        teff = input_features['st_teff']
        if teff > 6000:
            insights.append("Hot host star.")
        elif teff < 4000:
            insights.append("Cool host star (M-dwarf).")
    
    if insights:
        feature_insight = " Feature insights: " + " ".join(insights)
        return base_explanation + feature_insight
    else:
        return base_explanation

if __name__ == '__main__':
    port = int(os.getenv('K2_MODEL_PORT', 5003))  # Different port from TOI and KOI
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting K2 Model Server on port {port}")
    print(f"📊 K2 Model ready: {model.is_trained if model else False}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)