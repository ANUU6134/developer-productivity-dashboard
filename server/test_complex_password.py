# server/test_complex_password.py
import requests
import json

url = "http://localhost:8000/api/auth/register"

# Test with a complex password including special characters
test_user = {
    "email": "test_complex@example.com",
    "username": "test_complex",
    "full_name": "Test Complex User",
    "password": "6134@chuu"  # Your complex password
}

print(f"Testing registration with password: {test_user['password']}")
print(f"Password length: {len(test_user['password'])} bytes")

response = requests.post(url, json=test_user)
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    print("✅ Registration successful!")
    print(f"Response: {response.json()}")
else:
    print("❌ Registration failed!")
    print(f"Error: {response.text}")