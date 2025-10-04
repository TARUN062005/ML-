from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from preprocess import KOIDataPreprocessor
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

class KOIModel:
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
        print(f"✅ KOI Model saved to {file_path}")
    
    def load_model(self, file_path):
        """Load a trained model"""
        self.model = joblib.load(file_path)
        self.is_trained = True
        print(f"✅ KOI Model loaded from {file_path}")

def initialize_model():
    """Initialize or load the KOI model"""
    global model, preprocessor, label_encoder
    
    model_path = 'model.pkl'
    preprocessor_path = 'preprocessor.pkl'
    
    try:
        # Initialize preprocessor
        preprocessor = KOIDataPreprocessor()
        
        # Try to load existing model and preprocessor
        if os.path.exists(model_path) and os.path.exists(preprocessor_path):
            model = KOIModel()
            model.load_model(model_path)
            preprocessor.load_preprocessor(preprocessor_path)
            label_encoder = preprocessor.label_encoder
            print("✅ Pre-trained KOI model loaded successfully")
        else:
            model = KOIModel()
            print("ℹ️ No pre-trained KOI model found. Train the model first.")
            
    except Exception as e:
        print(f"❌ Error initializing KOI model: {e}")
        model = KOIModel()
        preprocessor = KOIDataPreprocessor()

# Initialize model when app starts
initialize_model()

def generate_prediction_charts(predicted_class, confidence, probabilities, input_features):
    """Generate charts and return as base64 images"""
    charts = {}
    
    try:
        # 1. Confidence Gauge Chart
        plt.figure(figsize=(8, 4))
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        # Confidence gauge
        ax1.barh([0], [confidence], color='skyblue', edgecolor='navy')
        ax1.set_xlim(0, 1)
        ax1.set_xlabel('Confidence')
        ax1.set_title(f'Confidence: {confidence:.1%}')
        ax1.grid(True, alpha=0.3)
        
        # Probability distribution
        classes = list(probabilities.keys())
        probs = list(probabilities.values())
        colors = ['lightcoral' if cls != predicted_class else 'lightgreen' for cls in classes]
        
        ax2.bar(classes, probs, color=colors, edgecolor='black')
        ax2.set_ylabel('Probability')
        ax2.set_title('Class Probabilities')
        ax2.tick_params(axis='x', rotation=45)
        plt.tight_layout()
        
        # Convert to base64
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        charts['confidence_chart'] = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        
        # 2. Feature Importance (simulated)
        plt.figure(figsize=(10, 6))
        if input_features:
            # KOI-specific features
            koi_features = ['koi_period', 'koi_depth', 'koi_prad', 'koi_teq', 'koi_insol', 'koi_model_snr']
            features = [f for f in koi_features if f in input_features][:6]
            values = [input_features[f] for f in features]
            
            # Normalize values for better visualization
            if values:
                values_normalized = [abs(v) / max(abs(max(values)), 1) for v in values]
                
                plt.barh(features, values_normalized, color='lightseagreen', edgecolor='black')
                plt.xlabel('Normalized Value')
                plt.title('KOI Input Feature Values')
                plt.tight_layout()
                
                buf = io.BytesIO()
                plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
                buf.seek(0)
                charts['feature_chart'] = base64.b64encode(buf.getvalue()).decode('utf-8')
                plt.close()
        
        # 3. KOI-specific transit characteristics
        plt.figure(figsize=(8, 6))
        if 'koi_depth' in input_features and 'koi_period' in input_features:
            depth = input_features['koi_depth']
            period = input_features['koi_period']
            
            # Create a scatter plot representation
            sizes = [100]  # Single point
            colors_scatter = ['red' if predicted_class == 'FALSE POSITIVE' else 
                            'orange' if predicted_class == 'CANDIDATE' else 
                            'green']
            
            plt.scatter([period], [depth], s=300, c=colors_scatter, alpha=0.7, edgecolors='black')
            plt.xlabel('Orbital Period (days)')
            plt.ylabel('Transit Depth (ppm)')
            plt.title('KOI Transit Characteristics')
            plt.grid(True, alpha=0.3)
            
            # Add classification regions
            plt.axhline(y=10000, color='red', linestyle='--', alpha=0.5, label='Very Deep')
            plt.axhline(y=100, color='blue', linestyle='--', alpha=0.5, label='Very Shallow')
            
            plt.legend()
            plt.tight_layout()
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
            buf.seek(0)
            charts['transit_chart'] = base64.b64encode(buf.getvalue()).decode('utf-8')
            plt.close()
        
    except Exception as e:
        print(f"Chart generation error: {e}")
    
    return charts

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model.is_trained if model else False,
        'preprocessor_loaded': preprocessor is not None,
        'model_type': 'KOI'
    })

@app.route('/train', methods=['POST'])
def train_model():
    """Train the KOI model"""
    global model, preprocessor, label_encoder
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file temporarily
        file_path = f"temp_koi_{file.filename}"
        file.save(file_path)
        
        # Initialize preprocessor
        preprocessor = KOIDataPreprocessor()
        
        # Preprocess data
        X, y = preprocessor.preprocess_pipeline(file_path)
        
        # Split data
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train model
        model = KOIModel()
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
            'message': 'KOI Model trained successfully',
            'evaluation': evaluation,
            'class_names': label_encoder.classes_.tolist()
        })
        
    except Exception as e:
        print(f"❌ KOI Training error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Make predictions on single or multiple samples"""
    global model, preprocessor, label_encoder
    
    try:
        if not model or not model.is_trained:
            return jsonify({'error': 'KOI Model not trained. Please train the model first.'}), 400
        
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
        charts = None
        
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
                explanation = get_koi_prediction_explanation(class_name, confidence, sample)
                
                prediction_data = {
                    'predicted_class': class_name,
                    'confidence': confidence,
                    'probabilities': class_probabilities,
                    'explanation': explanation,
                    'input_features': sample,
                    'timestamp': pd.Timestamp.now().isoformat()
                }
                
                # Generate charts only for single prediction
                if not is_batch:
                    charts = generate_prediction_charts(class_name, confidence, class_probabilities, sample)
                    prediction_data['charts'] = charts
                
                predictions.append(prediction_data)
                
            except Exception as e:
                predictions.append({
                    'error': str(e),
                    'input_features': sample,
                    'timestamp': pd.Timestamp.now().isoformat()
                })
        
        response_data = {
            'success': True,
            'predictions': predictions,
            'is_batch': is_batch,
            'total_predictions': len(predictions),
            'model_type': 'KOI'
        }
        
        if not is_batch:
            response_data['prediction'] = predictions[0]
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ KOI Prediction error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/model_info', methods=['GET'])
def get_model_info():
    """Get information about the trained KOI model"""
    global model, preprocessor, label_encoder
    
    if not model or not model.is_trained:
        return jsonify({'error': 'KOI Model not trained'}), 400
    
    info = {
        'is_trained': model.is_trained,
        'model_type': 'KOI',
        'feature_columns': preprocessor.feature_columns if preprocessor else [],
        'selected_features': preprocessor.selected_features if preprocessor else [],
        'class_names': label_encoder.classes_.tolist() if label_encoder else [],
        'target_column': preprocessor.target_column if preprocessor else '',
        'preprocessor_available': preprocessor is not None
    }
    
    return jsonify(info)

def get_koi_prediction_explanation(predicted_class, confidence, input_features):
    """Generate human-readable explanation for KOI prediction"""
    explanations = {
        'CONFIRMED': 'Confirmed Exoplanet - This object has been validated as a bona fide exoplanet through multiple observational methods and statistical validation.',
        'CANDIDATE': 'Planetary Candidate - Strong evidence suggests this is a planetary transit, but additional validation is required for confirmation.',
        'FALSE POSITIVE': 'False Positive - The detected signal is likely caused by astrophysical false positives, instrumental effects, or data processing artifacts rather than a genuine planetary transit.',
        'NOT DISPOSITIONED': 'Not Dispositioned - This object has not yet received a final classification and requires further analysis.'
    }
    
    base_explanation = explanations.get(predicted_class, 'Classification completed based on Kepler transit characteristics.')
    
    # Add feature-based insights specific to KOI data
    insights = []
    
    if 'koi_depth' in input_features:
        depth = input_features['koi_depth']
        if depth > 10000:
            insights.append("Very deep transit suggests large planetary radius or small host star.")
        elif depth < 100:
            insights.append("Shallow transit may indicate small planet or requires high precision detection.")
    
    if 'koi_period' in input_features:
        period = input_features['koi_period']
        if period < 1:
            insights.append("Ultra-short orbital period typical of hot planets close to their host stars.")
        elif period > 100:
            insights.append("Long orbital period suggests distant orbit from host star.")
    
    if 'koi_prad' in input_features:
        radius = input_features['koi_prad']
        if radius > 20:
            insights.append("Large planetary radius, potentially a gas giant.")
        elif radius < 2:
            insights.append("Small planetary radius, potentially rocky planet.")
    
    if 'koi_model_snr' in input_features:
        snr = input_features['koi_model_snr']
        if snr < 10:
            insights.append("Low signal-to-noise ratio suggests marginal detection.")
        elif snr > 50:
            insights.append("High signal-to-noise ratio indicates strong detection.")
    
    if 'koi_teq' in input_features:
        teq = input_features['koi_teq']
        if teq > 1000:
            insights.append("High equilibrium temperature suggests close-in hot planet.")
        elif teq < 300:
            insights.append("Low equilibrium temperature suggests cold distant planet.")
    
    if insights:
        feature_insight = " Feature insights: " + " ".join(insights)
        return base_explanation + feature_insight
    else:
        return base_explanation

if __name__ == '__main__':
    port = int(os.getenv('KOI_MODEL_PORT', 5002))  # Different port from TOI
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting KOI Model Server on port {port}")
    print(f"📊 KOI Model ready: {model.is_trained if model else False}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)