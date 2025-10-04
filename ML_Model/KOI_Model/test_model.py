#test_model.py for koi model
import requests
import json

def test_koi_api():
    """Test the KOI model API"""
    
    base_url = "http://localhost:5002"  # Different port from TOI
    
    print("🧪 Testing KOI Model API...")
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
    
    # Test 2: Model info
    print("\n2. Testing model info...")
    try:
        response = requests.get(f"{base_url}/model_info", timeout=10)
        if response.status_code == 200:
            info = response.json()
            print("✅ KOI Model Info:")
            print(f"   - Trained: {info.get('is_trained', 'N/A')}")
            print(f"   - Model Type: {info.get('model_type', 'N/A')}")
            print(f"   - Classes: {info.get('class_names', [])}")
            print(f"   - Features: {info.get('selected_features', [])}")
            print(f"   - Target: {info.get('target_column', 'N/A')}")
            print(f"   - Preprocessor: {info.get('preprocessor_available', 'N/A')}")
        else:
            print(f"❌ Model info failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Model info failed: {e}")
    
    # Test 3: Single prediction
    print("\n3. Testing single prediction...")
    sample_data = {
        "koi_period": 9.48803557,
        "koi_impact": 0.146,
        "koi_duration": 2.9575,
        "koi_depth": 616.0,
        "koi_prad": 2.26,
        "koi_teq": 793.0,
        "koi_insol": 93.59,
        "koi_model_snr": 35.8,
        "koi_steff": 5455,
        "koi_slogg": 4.467,
        "koi_srad": 0.927,
        "koi_kepmag": 15.347
    }
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=sample_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ KOI Single Prediction Result:")
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
    
    # Test 4: Batch prediction
    print("\n4. Testing batch prediction...")
    batch_data = [
        {
            "koi_period": 9.48803557,
            "koi_impact": 0.146,
            "koi_duration": 2.9575,
            "koi_depth": 616.0,
            "koi_prad": 2.26,
            "koi_teq": 793.0,
            "koi_insol": 93.59,
            "koi_model_snr": 35.8,
            "koi_steff": 5455,
            "koi_slogg": 4.467,
            "koi_srad": 0.927,
            "koi_kepmag": 15.347
        },
        {
            "koi_period": 1.736952453,
            "koi_impact": 1.276,
            "koi_duration": 2.40641,
            "koi_depth": 8080.0,
            "koi_prad": 33.46,
            "koi_teq": 1395.0,
            "koi_insol": 891.96,
            "koi_model_snr": 505.6,
            "koi_steff": 5805,
            "koi_slogg": 4.564,
            "koi_srad": 0.791,
            "koi_kepmag": 15.597
        }
    ]
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=batch_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ KOI Batch Prediction Result:")
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
    
    print("\n" + "=" * 50)
    print("🎉 KOI API Testing Completed!")

if __name__ == "__main__":
    test_koi_api()