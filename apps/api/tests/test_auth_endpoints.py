"""
Authentication API Endpoint Tests
Tests for all authentication-related API endpoints
"""

import pytest
import jwt
import json
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from unittest.mock import patch

from main import app
from services.auth import auth_service, users_db, JWT_SECRET, JWT_ALGORITHM

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_users_db():
    """Clear users database before each test"""
    users_db.clear()
    yield
    users_db.clear()

class TestRegistrationEndpoint:
    """Test user registration endpoint"""
    
    def test_successful_registration(self):
        """Test successful user registration"""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["brand"] == "viralsplit"
        assert data["user"]["credits"] == 100
        assert "password_hash" not in data["user"]
    
    def test_duplicate_email_registration(self):
        """Test registration with existing email"""
        # Register first user
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        # Try to register again with same email
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "different123",
            "brand": "viralsplit"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"]
    
    def test_case_insensitive_email_registration(self):
        """Test that email comparison is case insensitive"""
        # Register with lowercase
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        # Try to register with uppercase
        response = client.post("/api/auth/register", json={
            "email": "TEST@EXAMPLE.COM",
            "password": "different123",
            "brand": "viralsplit"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"]
    
    def test_registration_invalid_email(self):
        """Test registration with invalid email format"""
        response = client.post("/api/auth/register", json={
            "email": "invalid-email",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_registration_short_password(self):
        """Test registration with password too short"""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "short",
            "brand": "viralsplit"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "at least 8 characters" in data["detail"]
    
    def test_registration_missing_fields(self):
        """Test registration with missing required fields"""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_registration_empty_fields(self):
        """Test registration with empty email or password"""
        response = client.post("/api/auth/register", json={
            "email": "",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "required" in data["detail"]

class TestLoginEndpoint:
    """Test user login endpoint"""
    
    def test_successful_login(self):
        """Test successful user login"""
        # Register user first
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        # Login
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        assert data["user"]["email"] == "test@example.com"
        
        # Verify JWT token
        token = data["access_token"]
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert decoded["email"] == "test@example.com"
        assert decoded["type"] == "access"
    
    def test_login_case_insensitive_email(self):
        """Test login with case insensitive email"""
        # Register with lowercase
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        # Login with uppercase
        response = client.post("/api/auth/login", json={
            "email": "TEST@EXAMPLE.COM",
            "password": "password123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "test@example.com"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        # Register user first
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        # Try login with wrong password
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "Invalid email or password" in data["detail"]
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent user"""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "Invalid email or password" in data["detail"]
    
    def test_login_missing_fields(self):
        """Test login with missing fields"""
        response = client.post("/api/auth/login", json={
            "email": "test@example.com"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_login_empty_fields(self):
        """Test login with empty email or password"""
        response = client.post("/api/auth/login", json={
            "email": "",
            "password": "password123"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "required" in data["detail"]

class TestMeEndpoint:
    """Test get current user endpoint"""
    
    def test_get_current_user_success(self):
        """Test getting current user with valid token"""
        # Register and login
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        login_response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        token = login_response.json()["access_token"]
        
        # Get current user
        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "test@example.com"
        assert "password_hash" not in data["user"]
    
    def test_get_current_user_invalid_token(self):
        """Test getting current user with invalid token"""
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid-token"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "Invalid token" in data["detail"]
    
    def test_get_current_user_expired_token(self):
        """Test getting current user with expired token"""
        # Create expired token
        expired_payload = {
            'user_id': 'test-id',
            'email': 'test@example.com',
            'type': 'access',
            'exp': datetime.now(timezone.utc) - timedelta(hours=1),  # Expired
            'iat': datetime.now(timezone.utc) - timedelta(hours=2)
        }
        expired_token = jwt.encode(expired_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {expired_token}"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "expired" in data["detail"]
    
    def test_get_current_user_no_token(self):
        """Test getting current user without token"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 403
        data = response.json()
        assert "Not authenticated" in data["detail"]

class TestRefreshTokenEndpoint:
    """Test token refresh endpoint"""
    
    def test_refresh_token_success(self):
        """Test successful token refresh"""
        # Register and login
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        login_response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh token
        response = client.post("/api/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        
        # Verify new token is valid
        new_token = data["access_token"]
        decoded = jwt.decode(new_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert decoded["type"] == "access"
    
    def test_refresh_token_invalid(self):
        """Test refresh with invalid token"""
        response = client.post("/api/auth/refresh", json={
            "refresh_token": "invalid-refresh-token"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "Invalid token" in data["detail"]
    
    def test_refresh_token_missing(self):
        """Test refresh without providing token"""
        response = client.post("/api/auth/refresh", json={})
        
        assert response.status_code == 400
        data = response.json()
        assert "required" in data["detail"]

class TestPasswordHashing:
    """Test password hashing functionality"""
    
    def test_password_hashing_and_verification(self):
        """Test that passwords are properly hashed and verified"""
        password = "testpassword123"
        hashed = auth_service.hash_password(password)
        
        # Hash should not equal original password
        assert hashed != password
        
        # Should be able to verify correct password
        assert auth_service.verify_password(password, hashed) is True
        
        # Should not verify incorrect password
        assert auth_service.verify_password("wrongpassword", hashed) is False
    
    def test_password_not_stored_in_database(self):
        """Test that raw passwords are not stored in database"""
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        # Check that password is hashed in database
        user = None
        for u in users_db.values():
            if u['email'] == "test@example.com":
                user = u
                break
        
        assert user is not None
        assert "password_hash" in user
        assert user["password_hash"] != "password123"
        assert user["password_hash"].startswith("$2b$")  # bcrypt hash prefix

class TestJWTTokens:
    """Test JWT token functionality"""
    
    def test_jwt_token_structure(self):
        """Test JWT token contains correct information"""
        # Register and login
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        data = response.json()
        access_token = data["access_token"]
        refresh_token = data["refresh_token"]
        
        # Decode access token
        access_payload = jwt.decode(access_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert access_payload["email"] == "test@example.com"
        assert access_payload["type"] == "access"
        assert "user_id" in access_payload
        assert "exp" in access_payload
        assert "iat" in access_payload
        
        # Decode refresh token (note: uses different secret)
        from services.auth import JWT_REFRESH_SECRET
        refresh_payload = jwt.decode(refresh_token, JWT_REFRESH_SECRET, algorithms=[JWT_ALGORITHM])
        assert refresh_payload["type"] == "refresh"
        assert refresh_payload["user_id"] == access_payload["user_id"]

class TestSecurityFeatures:
    """Test security-related features"""
    
    def test_email_normalization(self):
        """Test that emails are normalized (lowercase, trimmed)"""
        response = client.post("/api/auth/register", json={
            "email": "  TEST@EXAMPLE.COM  ",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "test@example.com"
    
    def test_sql_injection_prevention(self):
        """Test that SQL injection attempts are safely handled"""
        # Try SQL injection in email field
        response = client.post("/api/auth/login", json={
            "email": "'; DROP TABLE users; --",
            "password": "password123"
        })
        
        # Should return 401 (invalid credentials) not cause any errors
        assert response.status_code == 401
    
    def test_password_brute_force_protection(self):
        """Test consistent timing for invalid login attempts"""
        import time
        
        # Register a user
        client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "brand": "viralsplit"
        })
        
        # Test login with wrong password (should take similar time as correct password)
        start_time = time.time()
        client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        wrong_password_time = time.time() - start_time
        
        # Test login with correct password
        start_time = time.time()
        client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        correct_password_time = time.time() - start_time
        
        # Times should be similar (within 50ms) to prevent timing attacks
        time_diff = abs(wrong_password_time - correct_password_time)
        assert time_diff < 0.05  # 50ms tolerance

class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_very_long_email(self):
        """Test registration with very long email"""
        long_email = "a" * 300 + "@example.com"
        response = client.post("/api/auth/register", json={
            "email": long_email,
            "password": "password123",
            "brand": "viralsplit"
        })
        
        # Should either accept it or return validation error, not crash
        assert response.status_code in [200, 400, 422]
    
    def test_unicode_in_password(self):
        """Test password with unicode characters"""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "pássw0rd123🔐",
            "brand": "viralsplit"
        })
        
        assert response.status_code == 200
        
        # Should be able to login with unicode password
        login_response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "pássw0rd123🔐"
        })
        
        assert login_response.status_code == 200
    
    def test_malformed_json_requests(self):
        """Test handling of malformed JSON requests"""
        response = client.post("/api/auth/login", 
                              data="invalid json",
                              headers={"Content-Type": "application/json"})
        
        assert response.status_code == 422  # Validation error
    
    def test_empty_request_body(self):
        """Test handling of empty request body"""
        response = client.post("/api/auth/login", json=None)
        
        assert response.status_code == 422  # Validation error

if __name__ == "__main__":
    pytest.main([__file__, "-v"])