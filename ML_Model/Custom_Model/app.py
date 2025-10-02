from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
import tempfile
import uuid
from datetime import datetime
from preprocess import CustomDataPreprocessor
from model import CustomModel
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# In-memory storage for user models (temporary)
# In production, you might want to use Redis or similar
user_models = {}
user_preprocessors = {}

class UserModelManager:
    """Manages user models in memory (temporary storage)"""
    
    @staticmethod
    def get_user_model(user_id):
        """Get user's current model"""
        return user_models.get(user_id)
    
    @staticmethod
    def set_user_model(user_id, model, preprocessor):
        """Set user's current model (replaces any existing)"""
        user_models[user_id] = model
        user_preprocessors[user_id] = preprocessor
        print(f"✅ Model set for user {user_id}. Total active users: {len(user_models)}")
    
    @staticmethod
    def delete_user_model(user_id):
        """Delete user's model"""
        if user_id in user_models:
            del user_models[user_id]
        if user_id in user_preprocessors:
            del user_preprocessors[user_id]
        print(f"🗑️ Model deleted for user {user_id}. Total active users: {len(user_models)}")
    
    @staticmethod
    def get_user_model_info(user_id):
        """Get user's model information"""
        model = user_models.get(user_id)
        preprocessor = user_preprocessors.get(user_id)
        
        if model and preprocessor:
            return {
                'has_model': True,
                'model_info': model.get_model_summary(),
                'preprocessor_info': {
                    'target_column': preprocessor.target_column,
                    'feature_columns': preprocessor.feature_columns,
                    'num_features': len(preprocessor.selected_features) if preprocessor.selected_features else 0,
                    'num_classes': len(preprocessor.label_encoder.classes_) if preprocessor.label_encoder else 0,
                    'classes': preprocessor.label_encoder.classes_.tolist() if preprocessor.label_encoder else []
                }
            }
        else:
            return {'has_model': False}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Custom Model',
        'active_users': len(user_models),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/train', methods=['POST'])
def train_model():
    """Train a custom model for a user"""
    try:
        # Get user ID from headers or request
        user_id = request.headers.get('X-User-ID') or request.json.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Check if file is provided
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get training parameters
        training_params = request.form.get('training_params', '{}')
        try:
            training_params = eval(training_params) if training_params else {}
        except:
            training_params = {}
        
        target_column = request.form.get('target_column')
        model_type = request.form.get('model_type', 'ensemble')
        
        print(f"🎯 Training custom model for user {user_id}")
        print(f"📊 Model type: {model_type}")
        print(f"🎯 Target column: {target_column}")
        
        # Save uploaded file temporarily
        file_extension = os.path.splitext(file.filename)[1].lower()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        file.save(temp_file.name)
        
        try:
            # Load data based on file type
            if file_extension == '.csv':
                df = pd.read_csv(temp_file.name)
            elif file_extension in ['.xlsx', '.xls']:
                df = pd.read_excel(temp_file.name)
            else:
                return jsonify({'error': f'Unsupported file type: {file_extension}'}), 400
            
            print(f"📊 Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")
            
            # Initialize and run preprocessing
            preprocessor = CustomDataPreprocessor()
            X, y = preprocessor.preprocess_data(df, target_column)
            
            # Create and train model
            model = CustomModel()
            model.create_model(model_type, training_params)
            model.train(X, y)
            
            # Store model for this user (replaces any existing)
            UserModelManager.set_user_model(user_id, model, preprocessor)
            
            # Get model info
            model_info = UserModelManager.get_user_model_info(user_id)
            
            return jsonify({
                'success': True,
                'message': 'Custom model trained successfully',
                'user_id': user_id,
                'model_info': model_info,
                'dataset_info': {
                    'original_shape': df.shape,
                    'training_samples': len(X),
                    'num_features': X.shape[1],
                    'num_classes': len(np.unique(y))
                }
            })
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file.name)
            
    except Exception as e:
        print(f"❌ Custom model training error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Make predictions using user's custom model"""
    try:
        user_id = request.headers.get('X-User-ID') or request.json.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Get user's model and preprocessor
        model = UserModelManager.get_user_model(user_id)
        preprocessor = user_preprocessors.get(user_id)
        
        if not model or not preprocessor:
            return jsonify({'error': 'No trained model found for user. Please train a model first.'}), 400
        
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
                class_name = preprocessor.label_encoder.inverse_transform([class_idx])[0]
                confidence = float(np.max(probabilities[0])) if probabilities is not None else 1.0
                
                # Get all class probabilities
                class_probabilities = {}
                if probabilities is not None:
                    for i, class_label in enumerate(preprocessor.label_encoder.classes_):
                        class_probabilities[class_label] = float(probabilities[0][i])
                
                # Create explanation
                explanation = get_custom_prediction_explanation(class_name, confidence, sample)
                
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
            'user_id': user_id,
            'predictions': predictions
        }
        
        if not is_batch:
            response_data['prediction'] = predictions[0]
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Custom model prediction error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/model/info', methods=['GET'])
def get_model_info():
    """Get information about user's current model"""
    try:
        user_id = request.headers.get('X-User-ID') or request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        model_info = UserModelManager.get_user_model_info(user_id)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            **model_info
        })
        
    except Exception as e:
        print(f"❌ Get model info error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/model/delete', methods=['DELETE'])
def delete_model():
    """Delete user's current model"""
    try:
        user_id = request.headers.get('X-User-ID') or request.json.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        UserModelManager.delete_user_model(user_id)
        
        return jsonify({
            'success': True,
            'message': 'Model deleted successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        print(f"❌ Delete model error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/features', methods=['GET'])
def get_expected_features():
    """Get the expected features for user's model"""
    try:
        user_id = request.headers.get('X-User-ID') or request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        preprocessor = user_preprocessors.get(user_id)
        
        if not preprocessor:
            return jsonify({'error': 'No trained model found for user'}), 400
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'expected_features': preprocessor.feature_columns,
            'target_column': preprocessor.target_column,
            'feature_types': {
                'numeric': preprocessor.numeric_features,
                'categorical': preprocessor.categorical_features
            }
        })
        
    except Exception as e:
        print(f"❌ Get features error: {e}")
        return jsonify({'error': str(e)}), 500

def get_custom_prediction_explanation(predicted_class, confidence, input_features):
    """Generate human-readable explanation for custom model prediction"""
    
    base_explanation = f"Predicted as '{predicted_class}' with {confidence:.1%} confidence."
    
    # Add feature-based insights if possible
    insights = []
    
    # Analyze numeric features
    numeric_features = {k: v for k, v in input_features.items() if isinstance(v, (int, float))}
    
    if numeric_features:
        # Find extreme values
        for feature, value in list(numeric_features.items())[:3]:  # Limit to first 3 features
            if value > 1000:
                insights.append(f"High {feature} ({value})")
            elif value < 0.1:
                insights.append(f"Very low {feature} ({value})")
    
    if insights:
        return base_explanation + " Key factors: " + ", ".join(insights) + "."
    else:
        return base_explanation + " Based on the trained custom model."

@app.route('/supported_formats', methods=['GET'])
def get_supported_formats():
    """Get supported file formats for training"""
    return jsonify({
        'success': True,
        'supported_formats': ['.csv', '.xlsx', '.xls'],
        'max_file_size': '10MB',
        'requirements': {
            'min_samples': 10,
            'min_features': 1,
            'max_features': 100
        }
    })

if __name__ == '__main__':
    port = int(os.getenv('CUSTOM_MODEL_PORT', 5004))  # Different port
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting Custom Model Server on port {port}")
    print(f"📊 Service: User-specific temporary model training")
    print(f"💾 Storage: In-memory (temporary)")
    print(f"👥 Active users: {len(user_models)}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)