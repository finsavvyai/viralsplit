import jwt
import bcrypt
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    brand: str = 'viralsplit'  # viralsplit or contentmulti

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    brand: str
    subscription_tier: str = 'free'
    subscription_status: str = 'active'
    credits: int = 100
    created_at: datetime
    updated_at: datetime

class SocialAccount(BaseModel):
    platform: str  # tiktok, instagram, youtube, etc.
    account_id: str
    account_name: str
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None

# In-memory user store (replace with database in production)
users_db: Dict[str, Dict] = {}
social_accounts_db: Dict[str, Dict] = {}

class AuthService:
    def __init__(self):
        self.jwt_secret = JWT_SECRET
        self.jwt_algorithm = JWT_ALGORITHM
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_jwt_token(self, user_id: str, email: str) -> str:
        """Create JWT token for user"""
        payload = {
            'user_id': user_id,
            'email': email,
                            'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
                'iat': datetime.now(timezone.utc)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    async def register_user(self, user_data: UserCreate) -> User:
        """Register a new user"""
        # Check if user already exists
        for user in users_db.values():
            if user['email'] == user_data.email:
                raise HTTPException(status_code=400, detail="User already exists")
        
        # Create new user
        user_id = f"user_{len(users_db) + 1}"  # In production, use UUID
        hashed_password = self.hash_password(user_data.password)
        
        user = {
            'id': user_id,
            'email': user_data.email,
            'password_hash': hashed_password,
            'brand': user_data.brand,
            'subscription_tier': 'free',
            'subscription_status': 'active',
            'credits': 100,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }
        
        users_db[user_id] = user
        
        return User(**{k: v for k, v in user.items() if k != 'password_hash'})
    
    async def login_user(self, login_data: UserLogin) -> Dict[str, Any]:
        """Login user and return token"""
        # Find user by email
        user = None
        for u in users_db.values():
            if u['email'] == login_data.email:
                user = u
                break
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not self.verify_password(login_data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate token
        token = self.create_jwt_token(user['id'], user['email'])
        
        return {
            'access_token': token,
            'token_type': 'bearer',
            'user': User(**{k: v for k, v in user.items() if k != 'password_hash'})
        }
    
    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
        """Get current authenticated user"""
        token = credentials.credentials
        payload = self.verify_jwt_token(token)
        
        user_id = payload.get('user_id')
        if not user_id or user_id not in users_db:
            raise HTTPException(status_code=401, detail="User not found")
        
        user = users_db[user_id]
        return User(**{k: v for k, v in user.items() if k != 'password_hash'})
    
    async def get_current_user_optional(self, request: Request) -> Optional[User]:
        """Get current authenticated user (optional - returns None if not authenticated)"""
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return None
            
            token = auth_header.replace('Bearer ', '')
            payload = self.verify_jwt_token(token)
            
            user_id = payload.get('user_id')
            if not user_id or user_id not in users_db:
                return None
            
            user = users_db[user_id]
            return User(**{k: v for k, v in user.items() if k != 'password_hash'})
        except:
            return None
    
    async def connect_social_account(self, user_id: str, social_data: SocialAccount) -> Dict[str, Any]:
        """Connect a social media account to user"""
        account_key = f"{user_id}_{social_data.platform}"
        
        account = {
            'user_id': user_id,
            'platform': social_data.platform,
            'account_id': social_data.account_id,
            'account_name': social_data.account_name,
            'access_token': social_data.access_token,
            'refresh_token': social_data.refresh_token,
            'expires_at': social_data.expires_at,
            'connected_at': datetime.now(timezone.utc)
        }
        
        social_accounts_db[account_key] = account
        
        return {
            'message': f'Successfully connected {social_data.platform} account',
            'account': account
        }
    
    async def get_user_social_accounts(self, user_id: str) -> list:
        """Get all social accounts for a user"""
        accounts = []
        for key, account in social_accounts_db.items():
            if account['user_id'] == user_id:
                accounts.append(account)
        return accounts
    
    async def disconnect_social_account(self, user_id: str, platform: str) -> Dict[str, str]:
        """Disconnect a social media account"""
        account_key = f"{user_id}_{platform}"
        
        if account_key in social_accounts_db:
            del social_accounts_db[account_key]
            return {'message': f'Successfully disconnected {platform} account'}
        else:
            raise HTTPException(status_code=404, detail=f'{platform} account not found')
    
    async def update_user_credits(self, user_id: str, credits_used: int) -> User:
        """Update user credits after video processing"""
        if user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users_db[user_id]
        user['credits'] = max(0, user['credits'] - credits_used)
        user['updated_at'] = datetime.now(timezone.utc)
        
        return User(**{k: v for k, v in user.items() if k != 'password_hash'})

# Initialize auth service
auth_service = AuthService()
