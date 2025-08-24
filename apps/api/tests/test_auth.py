import pytest
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, Mock
from fastapi import HTTPException
import asyncio

from services.auth import auth_service, UserCreate, UserLogin, SocialAccount

class TestAuthService:
    """Test cases for authentication service"""
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_hash_password(self):
        """Test password hashing"""
        password = "testpass123"
        hashed = auth_service.hash_password(password)
        
        assert hashed != password
        assert bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_verify_password(self):
        """Test password verification"""
        password = "testpass123"
        hashed = auth_service.hash_password(password)
        
        assert auth_service.verify_password(password, hashed) is True
        assert auth_service.verify_password("wrongpass", hashed) is False
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_create_jwt_token(self):
        """Test JWT token creation"""
        user_id = "user_1"
        email = "test@example.com"
        
        token = auth_service.create_jwt_token(user_id, email)
        
        # Verify token structure
        assert isinstance(token, str)
        assert len(token.split('.')) == 3  # JWT has 3 parts
        
        # Decode and verify payload
        payload = jwt.decode(token, auth_service.jwt_secret, algorithms=[auth_service.jwt_algorithm])
        assert payload['user_id'] == user_id
        assert payload['email'] == email
        assert 'exp' in payload
        assert 'iat' in payload
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_verify_jwt_token_valid(self):
        """Test valid JWT token verification"""
        user_id = "user_1"
        email = "test@example.com"
        token = auth_service.create_jwt_token(user_id, email)
        
        payload = auth_service.verify_jwt_token(token)
        
        assert payload['user_id'] == user_id
        assert payload['email'] == email
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_verify_jwt_token_invalid(self):
        """Test invalid JWT token verification"""
        with pytest.raises(HTTPException) as exc_info:
            auth_service.verify_jwt_token("invalid.token.here")
        
        assert exc_info.value.status_code == 401
        assert "Invalid token" in str(exc_info.value.detail)
    
    @pytest.mark.unit
    @pytest.mark.auth
    def test_verify_jwt_token_expired(self):
        """Test expired JWT token verification"""
        # Create a token with past expiration
        payload = {
            'user_id': 'user_1',
            'email': 'test@example.com',
            'exp': datetime.now(timezone.utc) - timedelta(hours=1),
            'iat': datetime.now(timezone.utc) - timedelta(hours=2)
        }
        expired_token = jwt.encode(payload, auth_service.jwt_secret, algorithm=auth_service.jwt_algorithm)
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.verify_jwt_token(expired_token)
        
        assert exc_info.value.status_code == 401
        assert "Token has expired" in str(exc_info.value.detail)

class TestUserRegistration:
    """Test cases for user registration"""
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_register_new_user(self, clear_test_data):
        """Test successful user registration"""
        user_data = UserCreate(
            email="newuser@example.com",
            password="newpass123",
            brand="viralsplit"
        )
        
        user = asyncio.run(auth_service.register_user(user_data))
        
        assert user.email == "newuser@example.com"
        assert user.brand == "viralsplit"
        assert user.subscription_tier == "free"
        assert user.credits == 100
        assert user.id is not None
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_register_duplicate_user(self, clear_test_data):
        """Test registration with existing email"""
        user_data = UserCreate(
            email="duplicate@example.com",
            password="pass123",
            brand="viralsplit"
        )
        
        # Register first user
        asyncio.run(auth_service.register_user(user_data))
        
        # Try to register again with same email
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(auth_service.register_user(user_data))
        
        assert exc_info.value.status_code == 400
        assert "User already exists" in str(exc_info.value.detail)
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_register_user_different_brands(self, clear_test_data):
        """Test registration with different brands"""
        user1_data = UserCreate(
            email="user1@example.com",
            password="pass123",
            brand="viralsplit"
        )
        
        user2_data = UserCreate(
            email="user2@example.com",
            password="pass456",
            brand="contentmulti"
        )
        
        user1 = asyncio.run(auth_service.register_user(user1_data))
        user2 = asyncio.run(auth_service.register_user(user2_data))
        
        assert user1.brand == "viralsplit"
        assert user2.brand == "contentmulti"
        assert user1.id != user2.id

class TestUserLogin:
    """Test cases for user login"""
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_login_successful(self, clear_test_data):
        """Test successful user login"""
        # Register user first
        user_data = UserCreate(
            email="login@example.com",
            password="loginpass123",
            brand="viralsplit"
        )
        asyncio.run(auth_service.register_user(user_data))
        
        # Login
        login_data = UserLogin(
            email="login@example.com",
            password="loginpass123"
        )
        
        result = asyncio.run(auth_service.login_user(login_data))
        
        assert 'access_token' in result
        assert result['token_type'] == 'bearer'
        assert result['user'].email == "login@example.com"
        assert result['user'].credits == 100
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_login_invalid_email(self, clear_test_data):
        """Test login with non-existent email"""
        login_data = UserLogin(
            email="nonexistent@example.com",
            password="anypass"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(auth_service.login_user(login_data))
        
        assert exc_info.value.status_code == 401
        assert "Invalid credentials" in str(exc_info.value.detail)
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_login_invalid_password(self, clear_test_data):
        """Test login with wrong password"""
        # Register user first
        user_data = UserCreate(
            email="wrongpass@example.com",
            password="correctpass",
            brand="viralsplit"
        )
        asyncio.run(auth_service.register_user(user_data))
        
        # Login with wrong password
        login_data = UserLogin(
            email="wrongpass@example.com",
            password="wrongpass"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(auth_service.login_user(login_data))
        
        assert exc_info.value.status_code == 401
        assert "Invalid credentials" in str(exc_info.value.detail)

class TestSocialAccountManagement:
    """Test cases for social account management"""
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_connect_social_account(self, clear_test_data):
        """Test connecting a social media account"""
        # Register user first
        user_data = UserCreate(
            email="social@example.com",
            password="socialpass123",
            brand="viralsplit"
        )
        user = asyncio.run(auth_service.register_user(user_data))
        
        # Connect social account
        social_data = SocialAccount(
            platform="tiktok",
            account_id="tiktok_123",
            account_name="My TikTok",
            access_token="access_token_123",
            refresh_token="refresh_token_123"
        )
        
        result = asyncio.run(auth_service.connect_social_account(user.id, social_data))
        
        assert "Successfully connected tiktok account" in result['message']
        assert result['account']['platform'] == "tiktok"
        assert result['account']['account_name'] == "My TikTok"
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_get_user_social_accounts(self, clear_test_data):
        """Test getting user's social accounts"""
        # Register user and connect accounts
        user_data = UserCreate(
            email="social@example.com",
            password="socialpass123",
            brand="viralsplit"
        )
        user = asyncio.run(auth_service.register_user(user_data))
        
        # Connect multiple accounts
        tiktok_data = SocialAccount(
            platform="tiktok",
            account_id="tiktok_123",
            account_name="My TikTok",
            access_token="access_token_123"
        )
        
        instagram_data = SocialAccount(
            platform="instagram",
            account_id="instagram_456",
            account_name="My Instagram",
            access_token="access_token_456"
        )
        
        asyncio.run(auth_service.connect_social_account(user.id, tiktok_data))
        asyncio.run(auth_service.connect_social_account(user.id, instagram_data))
        
        # Get accounts
        accounts = asyncio.run(auth_service.get_user_social_accounts(user.id))
        
        assert len(accounts) == 2
        platforms = [acc['platform'] for acc in accounts]
        assert "tiktok" in platforms
        assert "instagram" in platforms
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_disconnect_social_account(self, clear_test_data):
        """Test disconnecting a social media account"""
        # Register user and connect account
        user_data = UserCreate(
            email="disconnect@example.com",
            password="disconnectpass123",
            brand="viralsplit"
        )
        user = asyncio.run(auth_service.register_user(user_data))
        
        social_data = SocialAccount(
            platform="tiktok",
            account_id="tiktok_123",
            account_name="My TikTok",
            access_token="access_token_123"
        )
        
        asyncio.run(auth_service.connect_social_account(user.id, social_data))
        
        # Disconnect account
        result = asyncio.run(auth_service.disconnect_social_account(user.id, "tiktok"))
        
        assert "Successfully disconnected tiktok account" in result['message']
        
        # Verify account is removed
        accounts = asyncio.run(auth_service.get_user_social_accounts(user.id))
        assert len(accounts) == 0
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_disconnect_nonexistent_account(self, clear_test_data):
        """Test disconnecting a non-existent account"""
        user_data = UserCreate(
            email="disconnect@example.com",
            password="disconnectpass123",
            brand="viralsplit"
        )
        user = asyncio.run(auth_service.register_user(user_data))
        
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(auth_service.disconnect_social_account(user.id, "nonexistent"))
        
        assert exc_info.value.status_code == 404
        assert "nonexistent account not found" in str(exc_info.value.detail)

class TestCreditManagement:
    """Test cases for credit management"""
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_update_user_credits(self, clear_test_data):
        """Test updating user credits"""
        # Register user
        user_data = UserCreate(
            email="credits@example.com",
            password="creditspass123",
            brand="viralsplit"
        )
        user = asyncio.run(auth_service.register_user(user_data))
        
        # Update credits
        updated_user = asyncio.run(auth_service.update_user_credits(user.id, 25))
        
        assert updated_user.credits == 75  # 100 - 25
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_update_user_credits_insufficient(self, clear_test_data):
        """Test updating credits when insufficient"""
        # Register user
        user_data = UserCreate(
            email="credits@example.com",
            password="creditspass123",
            brand="viralsplit"
        )
        user = asyncio.run(auth_service.register_user(user_data))
        
        # Try to use more credits than available
        updated_user = asyncio.run(auth_service.update_user_credits(user.id, 150))
        
        assert updated_user.credits == 0  # Should not go below 0
    
    @pytest.mark.functional
    @pytest.mark.auth
    def test_update_nonexistent_user_credits(self, clear_test_data):
        """Test updating credits for non-existent user"""
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(auth_service.update_user_credits("nonexistent_user", 10))
        
        assert exc_info.value.status_code == 404
        assert "User not found" in str(exc_info.value.detail)
