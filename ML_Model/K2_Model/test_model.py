import requests
import json

def test_k2_api():
    """Test the K2 model API"""
    
    base_url = "http://localhost:5003"  # Different port from TOI and KOI
    
    print("🧪 Testing K2 Model API...")
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
            print("✅ K2 Model Info:")
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
        "pl_orbper": 41.688644,
        "pl_orbsmax": 0.241,
        "pl_rade": 2.23,
        "pl_bmasse": 16.3,
        "pl_orbeccen": 0.0,
        "pl_insol": 546.0,
        "pl_eqt": 793.0,
        "st_teff": 5766,
        "st_rad": 0.928,
        "st_mass": 0.961,
        "st_met": -0.15,
        "st_logg": 4.5,
        "sy_dist": 179.461,
        "sy_vmag": 10.849
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
            print("✅ K2 Single Prediction Result:")
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
            "pl_orbper": 41.688644,
            "pl_orbsmax": 0.241,
            "pl_rade": 2.23,
            "pl_bmasse": 16.3,
            "pl_orbeccen": 0.0,
            "pl_insol": 546.0,
            "pl_eqt": 793.0,
            "st_teff": 5766,
            "st_rad": 0.928,
            "st_mass": 0.961,
            "st_met": -0.15,
            "st_logg": 4.5,
            "sy_dist": 179.461,
            "sy_vmag": 10.849
        },
        {
            "pl_orbper": 2.30183,
            "pl_orbsmax": 0.03,
            "pl_rade": 1.12,
            "pl_bmasse": None,
            "pl_orbeccen": 0.0,
            "pl_insol": 1054.0,
            "pl_eqt": 1200.0,
            "st_teff": 4616.52,
            "st_rad": 0.762602,
            "st_mass": 0.73,
            "st_met": -0.03,
            "st_logg": 4.53679,
            "sy_dist": 97.1795,
            "sy_vmag": 11.727
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
            print("✅ K2 Batch Prediction Result:")
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
    print("🎉 K2 API Testing Completed!")

if __name__ == "__main__":
    test_k2_api()