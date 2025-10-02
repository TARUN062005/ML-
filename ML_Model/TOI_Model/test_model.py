import requests
import json

def test_toi_api():
    """Test the TOI model API"""
    
    base_url = "http://localhost:5001"
    
    print("🧪 Testing TOI Model API...")
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
            print("✅ Model Info:")
            print(f"   - Trained: {info.get('is_trained', 'N/A')}")
            print(f"   - Classes: {info.get('class_names', [])}")
            print(f"   - Features: {info.get('selected_features', [])}")
            print(f"   - Preprocessor: {info.get('preprocessor_available', 'N/A')}")
        else:
            print(f"❌ Model info failed with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Model info failed: {e}")
    
    # Test 3: Single prediction
    print("\n3. Testing single prediction...")
    sample_data = {
        "pl_orbper": 2.1713484,
        "pl_trandurh": 2.0172196,
        "pl_trandep": 656.8860989,
        "pl_rade": 5.8181633,
        "pl_insol": 22601.94858,
        "pl_eqt": 3127.204052,
        "st_tmag": 9.604,
        "st_dist": 485.735,
        "st_teff": 10249,
        "st_logg": 4.19,
        "st_rad": 2.16986
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
            print("✅ Single Prediction Result:")
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
            "pl_orbper": 2.1713484,
            "pl_trandurh": 2.0172196,
            "pl_trandep": 656.8860989,
            "pl_rade": 5.8181633,
            "pl_insol": 22601.94858,
            "pl_eqt": 3127.204052,
            "st_tmag": 9.604,
            "st_dist": 485.735,
            "st_teff": 10249,
            "st_logg": 4.19,
            "st_rad": 2.16986
        },
        {
            "pl_orbper": 1.9316462,
            "pl_trandurh": 3.166,
            "pl_trandep": 1286,
            "pl_rade": 11.2154,
            "pl_insol": 44464.5,
            "pl_eqt": 4045,
            "st_tmag": 9.42344,
            "st_dist": 295.862,
            "st_teff": 7070,
            "st_logg": 4.03,
            "st_rad": 2.01
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
            print("✅ Batch Prediction Result:")
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
    print("🎉 API Testing Completed!")

if __name__ == "__main__":
    test_toi_api()