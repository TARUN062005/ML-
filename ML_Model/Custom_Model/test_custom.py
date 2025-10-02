import requests
import json
import pandas as pd
import numpy as np
import tempfile
import os

def test_custom_api():
    """Test the Custom Model API"""
    
    base_url = "http://localhost:5004"
    user_id = "test_user_123"
    
    print("🧪 Testing Custom Model API...")
    print("=" * 50)
    
    # Test 1: Health check
    print("1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health check: {health_data}")
        else:
            print(f"❌ Health check failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # Test 2: Create sample dataset for training
    print("\n2. Creating sample dataset...")
    
    # Create a sample dataset
    sample_data = {
        'feature1': np.random.normal(0, 1, 100),
        'feature2': np.random.normal(5, 2, 100),
        'feature3': np.random.choice(['A', 'B', 'C'], 100),
        'target': np.random.choice(['Class_X', 'Class_Y', 'Class_Z'], 100)
    }
    df = pd.DataFrame(sample_data)
    
    # Save to temporary CSV
    temp_csv = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv')
    df.to_csv(temp_csv.name, index=False)
    temp_csv.close()
    
    print(f"✅ Created sample dataset: {df.shape}")
    print(f"   Target distribution: {df['target'].value_counts().to_dict()}")
    
    # Test 3: Train model
    print("\n3. Testing model training...")
    try:
        with open(temp_csv.name, 'rb') as f:
            files = {'file': ('sample_data.csv', f, 'text/csv')}
            data = {
                'user_id': user_id,
                'model_type': 'ensemble',
                'target_column': 'target'
            }
            
            response = requests.post(
                f"{base_url}/train",
                files=files,
                data=data,
                timeout=30
            )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Custom Model Training Result:")
            print(f"   - Success: {result.get('success', 'N/A')}")
            print(f"   - User ID: {result.get('user_id', 'N/A')}")
            print(f"   - Message: {result.get('message', 'N/A')}")
            
            model_info = result.get('model_info', {})
            if model_info.get('has_model'):
                print("   - Model: Trained and ready")
                preprocessor_info = model_info.get('preprocessor_info', {})
                print(f"   - Classes: {preprocessor_info.get('classes', [])}")
                print(f"   - Features: {preprocessor_info.get('num_features', 0)}")
            else:
                print("   - Model: Not trained")
                
        else:
            print(f"❌ Training failed with status: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Training test failed: {e}")
    finally:
        # Clean up
        os.unlink(temp_csv.name)
    
    # Test 4: Model info
    print("\n4. Testing model info...")
    try:
        response = requests.get(
            f"{base_url}/model/info",
            headers={'X-User-ID': user_id},
            timeout=10
        )
        if response.status_code == 200:
            info = response.json()
            print("✅ Custom Model Info:")
            print(f"   - Has Model: {info.get('has_model', 'N/A')}")
            print(f"   - User ID: {info.get('user_id', 'N/A')}")
            
            if info.get('has_model'):
                preprocessor_info = info.get('preprocessor_info', {})
                print(f"   - Target: {preprocessor_info.get('target_column', 'N/A')}")
                print(f"   - Classes: {preprocessor_info.get('classes', [])}")
                print(f"   - Features: {preprocessor_info.get('num_features', 0)}")
        else:
            print(f"❌ Model info failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Model info failed: {e}")
    
    # Test 5: Single prediction
    print("\n5. Testing single prediction...")
    sample_prediction_data = {
        "feature1": 0.5,
        "feature2": 4.2,
        "feature3": "B"
    }
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=sample_prediction_data,
            headers={
                'Content-Type': 'application/json',
                'X-User-ID': user_id
            },
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ Custom Model Prediction Result:")
            if 'prediction' in result:
                pred = result['prediction']
                print(f"   - Predicted Class: {pred.get('predicted_class', 'N/A')}")
                print(f"   - Confidence: {pred.get('confidence', 'N/A'):.4f}")
                print(f"   - Explanation: {pred.get('explanation', 'N/A')}")
                
                # Show probabilities
                print("   - Probabilities:")
                probs = pred.get('probabilities', {})
                for cls, prob in probs.items():
                    print(f"     {cls}: {prob:.4f}")
            else:
                print("   ❌ No prediction in response")
        else:
            print(f"❌ Prediction failed with status: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Single prediction test failed: {e}")
    
    # Test 6: Batch prediction
    print("\n6. Testing batch prediction...")
    batch_data = [
        {"feature1": 0.5, "feature2": 4.2, "feature3": "B"},
        {"feature1": -1.2, "feature2": 6.8, "feature3": "A"},
        {"feature1": 2.1, "feature2": 3.1, "feature3": "C"}
    ]
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=batch_data,
            headers={
                'Content-Type': 'application/json',
                'X-User-ID': user_id
            },
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ Custom Model Batch Prediction Result:")
            print(f"   - Total predictions: {len(result.get('predictions', []))}")
            
            for i, pred in enumerate(result.get('predictions', [])):
                if 'error' in pred:
                    print(f"   ❌ Prediction {i+1} error: {pred['error']}")
                else:
                    print(f"   - Prediction {i+1}:")
                    print(f"     Class: {pred.get('predicted_class', 'N/A')}")
                    print(f"     Confidence: {pred.get('confidence', 'N/A'):.4f}")
        else:
            print(f"❌ Batch prediction failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Batch prediction test failed: {e}")
    
    # Test 7: Get expected features
    print("\n7. Testing features endpoint...")
    try:
        response = requests.get(
            f"{base_url}/features",
            headers={'X-User-ID': user_id},
            timeout=10
        )
        if response.status_code == 200:
            features = response.json()
            print("✅ Expected Features:")
            print(f"   - Features: {features.get('expected_features', [])}")
            print(f"   - Target: {features.get('target_column', 'N/A')}")
            feature_types = features.get('feature_types', {})
            print(f"   - Numeric: {len(feature_types.get('numeric', []))}")
            print(f"   - Categorical: {len(feature_types.get('categorical', []))}")
        else:
            print(f"❌ Features endpoint failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Features test failed: {e}")
    
    # Test 8: Delete model
    print("\n8. Testing model deletion...")
    try:
        response = requests.delete(
            f"{base_url}/model/delete",
            json={'user_id': user_id},
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ Model Deletion Result:")
            print(f"   - Success: {result.get('success', 'N/A')}")
            print(f"   - Message: {result.get('message', 'N/A')}")
        else:
            print(f"❌ Model deletion failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Model deletion test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Custom Model API Testing Completed!")

if __name__ == "__main__":
    test_custom_api()