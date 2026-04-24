import requests
import sys

def test_health():
    print("Testing /health ... ", end="")
    try:
        r = requests.get("http://localhost:8000/health", timeout=5)
        if r.status_code == 200:
            print("OK")
        else:
            print(f"FAILED ({r.status_code})")
            sys.exit(1)
    except Exception as e:
        print(f"FAILED ({e})")
        sys.exit(1)

def test_estimate():
    print("Testing POST /api/estimate ... ", end="")
    payload = {
      "area_sqm": 85,
      "bedrooms": 2,
      "bathrooms": 1,
      "district": "lemesos",
      "municipality": "Agía Zóni",
      "property_type": "apartment",
      "listing_type": "resale",
      "has_parking": True,
      "has_sea_view": False,
      "has_pool": False,
      "has_garden": False,
      "has_title_deed": True
    }
    try:
        r = requests.post("http://localhost:8000/api/estimate", json=payload, timeout=5)
        if r.status_code == 200:
            data = r.json()
            if "estimate" in data:
                print(f"OK (Estimate: €{data['estimate']})")
            else:
                print("FAILED (No estimate in response)")
                print(data)
                sys.exit(1)
        else:
            print(f"FAILED ({r.status_code})")
            print(r.text)
            sys.exit(1)
    except Exception as e:
        print(f"FAILED ({e})")
        sys.exit(1)

def test_comparables():
    print("Testing GET /api/comparables ... ", end="")
    try:
        r = requests.get("http://localhost:8000/api/comparables?district=lemesos&property_type=apartment&area_sqm=85", timeout=5)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list):
                print(f"OK ({len(data)} comparables returned)")
            else:
                print("FAILED (Expected a list)")
                sys.exit(1)
        else:
            print(f"FAILED ({r.status_code})")
            sys.exit(1)
    except Exception as e:
        print(f"FAILED ({e})")
        sys.exit(1)

def test_market_stats():
    print("Testing GET /api/market-stats/lemesos ... ", end="")
    try:
        r = requests.get("http://localhost:8000/api/market-stats/lemesos", timeout=5)
        if r.status_code == 200:
            data = r.json()
            if "median_price_sqm" in data:
                print(f"OK (Median Price per sqm: €{data['median_price_sqm']})")
            else:
                print("FAILED (Invalid response)")
                sys.exit(1)
        else:
            print(f"FAILED ({r.status_code})")
            sys.exit(1)
    except Exception as e:
        print(f"FAILED ({e})")
        sys.exit(1)

if __name__ == "__main__":
    print("=== CyprusAVM Backend E2E Test ===")
    test_health()
    test_estimate()
    test_comparables()
    test_market_stats()
    print("✓ All tests passed!")
