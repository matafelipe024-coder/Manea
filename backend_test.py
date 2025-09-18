import requests
import sys
import json
from datetime import datetime

class ManeaAPITester:
    def __init__(self, base_url="https://maneadb.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'user_id': None,
            'finca_id': None,
            'bovino_id': None,
            'alerta_id': None
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Response ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        test_user_data = {
            "nombre_completo": f"Test User {datetime.now().strftime('%H%M%S')}",
            "correo": f"test_{datetime.now().strftime('%H%M%S')}@test.com",
            "clave": "TestPass123!",
            "rol": "ganadero"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data,
            auth_required=False
        )
        
        if success and 'id' in response:
            self.created_resources['user_id'] = response['id']
            # Store credentials for login test
            self.test_credentials = {
                'correo': test_user_data['correo'],
                'clave': test_user_data['clave']
            }
            return True
        return False

    def test_auth_login(self):
        """Test user login"""
        if not hasattr(self, 'test_credentials'):
            print("❌ Cannot test login - no registered user")
            return False
            
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=self.test_credentials,
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_init_data(self):
        """Test sample data initialization"""
        success, response = self.run_test(
            "Initialize Sample Data",
            "POST",
            "init-data",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            expected_keys = ['total_bovinos', 'total_fincas', 'alertas_activas', 'bovinos_por_tipo']
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️  Missing key in response: {key}")
                else:
                    print(f"   📊 {key}: {response[key]}")
        return success

    def test_get_fincas(self):
        """Test get farms"""
        success, response = self.run_test(
            "Get Fincas",
            "GET",
            "fincas",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            self.created_resources['finca_id'] = response[0]['id']
            print(f"   Found {len(response)} fincas, using first one: {response[0]['nombre']}")
        return success

    def test_get_bovinos(self):
        """Test get cattle"""
        success, response = self.run_test(
            "Get Bovinos",
            "GET",
            "bovinos",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} bovinos")
            if len(response) > 0:
                self.created_resources['bovino_id'] = response[0]['id']
                print(f"   Sample bovino: {response[0].get('nombre', 'No name')} - {response[0]['caravana']}")
        return success

    def test_create_bovino(self):
        """Test create cattle"""
        if not self.created_resources['finca_id']:
            print("❌ Cannot create bovino - no finca available")
            return False
            
        bovino_data = {
            "finca_id": self.created_resources['finca_id'],
            "caravana": f"TEST{datetime.now().strftime('%H%M%S')}",
            "nombre": "Test Bovino",
            "sexo": "H",
            "raza": "Holstein",
            "tipo_ganado": "leche",
            "estado_ganado": "activo",
            "peso_kg": 450.5
        }
        
        success, response = self.run_test(
            "Create Bovino",
            "POST",
            "bovinos",
            200,
            data=bovino_data
        )
        
        if success and 'id' in response:
            self.created_resources['bovino_id'] = response['id']
        return success

    def test_update_bovino(self):
        """Test update cattle"""
        if not self.created_resources['bovino_id']:
            print("❌ Cannot update bovino - no bovino available")
            return False
            
        update_data = {
            "finca_id": self.created_resources['finca_id'],
            "caravana": f"UPD{datetime.now().strftime('%H%M%S')}",
            "nombre": "Updated Test Bovino",
            "sexo": "H",
            "raza": "Jersey",
            "tipo_ganado": "dual",
            "estado_ganado": "activo",
            "peso_kg": 480.0
        }
        
        success, response = self.run_test(
            "Update Bovino",
            "PUT",
            f"bovinos/{self.created_resources['bovino_id']}",
            200,
            data=update_data
        )
        return success

    def test_get_alertas(self):
        """Test get alerts"""
        success, response = self.run_test(
            "Get Alertas",
            "GET",
            "alertas",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} alertas")
            if len(response) > 0:
                self.created_resources['alerta_id'] = response[0]['id']
        return success

    def test_create_alerta(self):
        """Test create alert"""
        if not self.created_resources['bovino_id']:
            print("❌ Cannot create alerta - no bovino available")
            return False
            
        alerta_data = {
            "bovino_id": self.created_resources['bovino_id'],
            "tipo_alerta": "control_peso",
            "severidad": 2,
            "mensaje": "Test alert message",
            "fecha_vencimiento": "2024-12-31"
        }
        
        success, response = self.run_test(
            "Create Alerta",
            "POST",
            "alertas",
            200,
            data=alerta_data
        )
        
        if success and 'id' in response:
            self.created_resources['alerta_id'] = response['id']
        return success

    def test_delete_bovino(self):
        """Test delete cattle"""
        if not self.created_resources['bovino_id']:
            print("❌ Cannot delete bovino - no bovino available")
            return False
            
        success, response = self.run_test(
            "Delete Bovino",
            "DELETE",
            f"bovinos/{self.created_resources['bovino_id']}",
            200
        )
        return success

def main():
    print("🐄 Starting Manea API Testing...")
    print("=" * 50)
    
    tester = ManeaAPITester()
    
    # Test sequence
    test_sequence = [
        ("User Registration", tester.test_auth_register),
        ("User Login", tester.test_auth_login),
        ("Get Current User", tester.test_auth_me),
        ("Initialize Sample Data", tester.test_init_data),
        ("Dashboard Statistics", tester.test_dashboard_stats),
        ("Get Fincas", tester.test_get_fincas),
        ("Get Bovinos", tester.test_get_bovinos),
        ("Create Bovino", tester.test_create_bovino),
        ("Update Bovino", tester.test_update_bovino),
        ("Get Alertas", tester.test_get_alertas),
        ("Create Alerta", tester.test_create_alerta),
        ("Delete Bovino", tester.test_delete_bovino),
    ]
    
    # Run all tests
    for test_name, test_func in test_sequence:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())