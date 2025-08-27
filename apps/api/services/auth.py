import jwt
import bcrypt
import os
import secrets
import string
import qrcode
import io
import base64
import pyotp
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

load_dotenv()

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production-please-change-this-to-a-strong-random-key')
JWT_REFRESH_SECRET = os.getenv('JWT_REFRESH_SECRET', 'refresh-secret-key-change-in-production-different-from-access')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
JWT_REFRESH_EXPIRATION_DAYS = 7

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
    email_verified: bool = False
    last_login: Optional[datetime] = None
    mfa_enabled: bool = False
    is_admin: bool = False
    registration_approved: bool = True
    approval_requested_at: Optional[datetime] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class VerifyEmailRequest(BaseModel):
    token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class EnableMFARequest(BaseModel):
    password: str

class VerifyMFARequest(BaseModel):
    code: str

class LoginWithMFARequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: str

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    subscription_tier: Optional[str] = None
    credits: Optional[int] = None
    registration_approved: Optional[bool] = None
    is_admin: Optional[bool] = None

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
email_verification_tokens: Dict[str, Dict] = {}
password_reset_tokens: Dict[str, Dict] = {}
mfa_secrets: Dict[str, str] = {}
mfa_backup_codes: Dict[str, List[str]] = {}

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@viralsplit.io')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://viralsplit.io')

class AuthService:
    def __init__(self):
        self.jwt_secret = JWT_SECRET
        self.jwt_algorithm = JWT_ALGORITHM
        # Create default admin user if none exists
        self._create_default_admin()
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_jwt_token(self, user_id: str, email: str) -> str:
        """Create JWT access token for user"""
        payload = {
            'user_id': user_id,
            'email': email,
            'type': 'access',
            'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.now(timezone.utc)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def create_refresh_token(self, user_id: str) -> str:
        """Create JWT refresh token for user"""
        payload = {
            'user_id': user_id,
            'type': 'refresh',
            'exp': datetime.now(timezone.utc) + timedelta(days=JWT_REFRESH_EXPIRATION_DAYS),
            'iat': datetime.now(timezone.utc)
        }
        return jwt.encode(payload, JWT_REFRESH_SECRET, algorithm=self.jwt_algorithm)
    
    def _create_default_admin(self):
        """Create default admin user if none exists"""
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@viralsplit.io')
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123456')
        
        # Check if admin already exists
        admin_exists = any(user.get('is_admin', False) for user in users_db.values())
        
        if not admin_exists:
            import uuid
            admin_id = str(uuid.uuid4())
            hashed_password = self.hash_password(admin_password)
            
            admin_user = {
                'id': admin_id,
                'email': admin_email.lower().strip(),
                'password_hash': hashed_password,
                'brand': 'viralsplit',
                'subscription_tier': 'enterprise',
                'subscription_status': 'active',
                'credits': 100000,
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
                'email_verified': True,
                'last_login': None,
                'mfa_enabled': False,
                'is_admin': True,
                'registration_approved': True,
                'approval_requested_at': None
            }
            
            users_db[admin_id] = admin_user
    
    def generate_verification_token(self) -> str:
        """Generate a secure verification token"""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate MFA backup codes"""
        return [''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8)) for _ in range(count)]
    
    def send_email(self, to_email: str, subject: str, body: str, is_html: bool = False) -> bool:
        """Send email via SMTP"""
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print(f"Email would be sent to {to_email}: {subject}")
            return True  # Mock success for development
            
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = FROM_EMAIL
            msg['To'] = to_email
            
            if is_html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def send_verification_email(self, email: str, token: str) -> bool:
        """Send email verification"""
        verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
        
        subject = "Verify Your ViralSplit Account"
        body = f"""
        Welcome to ViralSplit!
        
        Please verify your email address by clicking the link below:
        {verification_link}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        The ViralSplit Team
        """
        
        return self.send_email(email, subject, body)
    
    def send_password_reset_email(self, email: str, token: str) -> bool:
        """Send password reset email"""
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        
        subject = "Reset Your ViralSplit Password"
        body = f"""
        We received a request to reset your ViralSplit account password.
        
        Click the link below to reset your password:
        {reset_link}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        The ViralSplit Team
        """
        
        return self.send_email(email, subject, body)
    
    def verify_jwt_token(self, token: str, token_type: str = 'access') -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            secret = self.jwt_secret if token_type == 'access' else JWT_REFRESH_SECRET
            payload = jwt.decode(token, secret, algorithms=[self.jwt_algorithm])
            
            # Verify token type
            if payload.get('type') != token_type:
                raise HTTPException(status_code=401, detail=f"Invalid token type. Expected {token_type}")
            
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    async def register_user(self, user_data: UserCreate, require_approval: bool = False) -> Dict[str, Any]:
        """Register a new user"""
        # Validate input
        if not user_data.email or not user_data.password:
            raise HTTPException(status_code=400, detail="Email and password are required")
        
        if len(user_data.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Check if user already exists
        for user in users_db.values():
            if user['email'].lower() == user_data.email.lower():
                raise HTTPException(status_code=400, detail="A user with this email already exists")
        
        # Create new user
        import uuid
        user_id = str(uuid.uuid4())
        hashed_password = self.hash_password(user_data.password)
        
        user = {
            'id': user_id,
            'email': user_data.email.lower().strip(),
            'password_hash': hashed_password,
            'brand': user_data.brand,
            'subscription_tier': 'free',
            'subscription_status': 'active',
            'credits': 100,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'email_verified': False,
            'last_login': None,
            'mfa_enabled': False,
            'is_admin': False,
            'registration_approved': not require_approval,
            'approval_requested_at': datetime.now(timezone.utc) if require_approval else None
        }
        
        users_db[user_id] = user
        
        # Generate and send email verification
        verification_token = self.generate_verification_token()
        email_verification_tokens[verification_token] = {
            'user_id': user_id,
            'email': user_data.email.lower().strip(),
            'created_at': datetime.now(timezone.utc),
            'expires_at': datetime.now(timezone.utc) + timedelta(hours=24)
        }
        
        # Send verification email
        if self.send_verification_email(user_data.email, verification_token):
            message = "Registration successful! Please check your email to verify your account."
        else:
            message = "Registration successful! Email verification failed - please request a new verification email."
        
        if require_approval:
            message += " Your account will be reviewed before approval."
        
        return {
            'user': User(**{k: v for k, v in user.items() if k != 'password_hash'}),
            'message': message,
            'verification_token': verification_token if not self.send_verification_email else None
        }
    
    async def login_user(self, login_data: UserLogin) -> Dict[str, Any]:
        """Login user and return token"""
        if not login_data.email or not login_data.password:
            raise HTTPException(status_code=400, detail="Email and password are required")
        
        # Find user by email (case insensitive)
        user = None
        for u in users_db.values():
            if u['email'].lower() == login_data.email.lower().strip():
                user = u
                break
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not self.verify_password(login_data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if account is approved
        if not user.get('registration_approved', True):
            raise HTTPException(status_code=403, detail="Account pending approval")
        
        # Check if MFA is enabled
        if user.get('mfa_enabled', False):
            raise HTTPException(status_code=202, detail="MFA required", headers={
                'X-MFA-Required': 'true'
            })
        
        # Update last login
        user['last_login'] = datetime.now(timezone.utc)
        user['updated_at'] = datetime.now(timezone.utc)
        
        # Generate tokens
        access_token = self.create_jwt_token(user['id'], user['email'])
        refresh_token = self.create_refresh_token(user['id'])
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'expires_in': JWT_EXPIRATION_HOURS * 3600,
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
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        payload = self.verify_jwt_token(refresh_token, 'refresh')
        user_id = payload.get('user_id')
        
        if not user_id or user_id not in users_db:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user = users_db[user_id]
        new_access_token = self.create_jwt_token(user['id'], user['email'])
        
        return {
            'access_token': new_access_token,
            'token_type': 'bearer',
            'expires_in': JWT_EXPIRATION_HOURS * 3600
        }
    
    async def send_verification_email_endpoint(self, email_data: EmailVerificationRequest) -> Dict[str, str]:
        """Send or resend email verification"""
        # Find user by email
        user = None
        for u in users_db.values():
            if u['email'].lower() == email_data.email.lower():
                user = u
                break
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user['email_verified']:
            raise HTTPException(status_code=400, detail="Email already verified")
        
        # Generate new verification token
        verification_token = self.generate_verification_token()
        email_verification_tokens[verification_token] = {
            'user_id': user['id'],
            'email': user['email'],
            'created_at': datetime.now(timezone.utc),
            'expires_at': datetime.now(timezone.utc) + timedelta(hours=24)
        }
        
        # Send verification email
        if self.send_verification_email(user['email'], verification_token):
            return {'message': 'Verification email sent successfully'}
        else:
            raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    async def verify_email(self, verify_data: VerifyEmailRequest) -> Dict[str, str]:
        """Verify email address with token"""
        token_data = email_verification_tokens.get(verify_data.token)
        
        if not token_data:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        if datetime.now(timezone.utc) > token_data['expires_at']:
            del email_verification_tokens[verify_data.token]
            raise HTTPException(status_code=400, detail="Verification token has expired")
        
        user_id = token_data['user_id']
        if user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mark email as verified
        users_db[user_id]['email_verified'] = True
        users_db[user_id]['updated_at'] = datetime.now(timezone.utc)
        
        # Remove used token
        del email_verification_tokens[verify_data.token]
        
        return {'message': 'Email verified successfully'}
    
    async def request_password_reset(self, reset_data: PasswordResetRequest) -> Dict[str, str]:
        """Request password reset"""
        # Find user by email
        user = None
        for u in users_db.values():
            if u['email'].lower() == reset_data.email.lower():
                user = u
                break
        
        if not user:
            # Don't reveal if user exists or not
            return {'message': 'If an account with that email exists, you will receive a password reset link'}
        
        # Generate reset token
        reset_token = self.generate_verification_token()
        password_reset_tokens[reset_token] = {
            'user_id': user['id'],
            'email': user['email'],
            'created_at': datetime.now(timezone.utc),
            'expires_at': datetime.now(timezone.utc) + timedelta(hours=1)
        }
        
        # Send reset email
        self.send_password_reset_email(user['email'], reset_token)
        
        return {'message': 'If an account with that email exists, you will receive a password reset link'}
    
    async def reset_password(self, reset_data: ResetPasswordRequest) -> Dict[str, str]:
        """Reset password with token"""
        token_data = password_reset_tokens.get(reset_data.token)
        
        if not token_data:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        if datetime.now(timezone.utc) > token_data['expires_at']:
            del password_reset_tokens[reset_data.token]
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        user_id = token_data['user_id']
        if user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")
        
        if len(reset_data.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Update password
        users_db[user_id]['password_hash'] = self.hash_password(reset_data.new_password)
        users_db[user_id]['updated_at'] = datetime.now(timezone.utc)
        
        # Remove used token
        del password_reset_tokens[reset_data.token]
        
        return {'message': 'Password reset successfully'}
    
    async def enable_mfa(self, user_id: str, mfa_data: EnableMFARequest) -> Dict[str, Any]:
        """Enable MFA for user"""
        if user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users_db[user_id]
        
        # Verify current password
        if not self.verify_password(mfa_data.password, user['password_hash']):
            raise HTTPException(status_code=400, detail="Invalid password")
        
        if user['mfa_enabled']:
            raise HTTPException(status_code=400, detail="MFA is already enabled")
        
        # Generate TOTP secret
        secret = pyotp.random_base32()
        mfa_secrets[user_id] = secret
        
        # Generate backup codes
        backup_codes = self.generate_backup_codes()
        mfa_backup_codes[user_id] = backup_codes
        
        # Generate QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user['email'],
            issuer_name="ViralSplit"
        )
        
        # Create QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        qr_code = base64.b64encode(buf.getvalue()).decode()
        
        return {
            'secret': secret,
            'qr_code': qr_code,
            'backup_codes': backup_codes,
            'message': 'Scan the QR code with your authenticator app and verify with a code to complete setup'
        }
    
    async def verify_mfa_setup(self, user_id: str, mfa_data: VerifyMFARequest) -> Dict[str, str]:
        """Verify MFA setup and enable it"""
        if user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user_id not in mfa_secrets:
            raise HTTPException(status_code=400, detail="MFA setup not initiated")
        
        secret = mfa_secrets[user_id]
        totp = pyotp.TOTP(secret)
        
        if not totp.verify(mfa_data.code):
            raise HTTPException(status_code=400, detail="Invalid MFA code")
        
        # Enable MFA for user
        users_db[user_id]['mfa_enabled'] = True
        users_db[user_id]['updated_at'] = datetime.now(timezone.utc)
        
        return {'message': 'MFA enabled successfully'}
    
    async def disable_mfa(self, user_id: str, mfa_data: EnableMFARequest) -> Dict[str, str]:
        """Disable MFA for user"""
        if user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users_db[user_id]
        
        # Verify current password
        if not self.verify_password(mfa_data.password, user['password_hash']):
            raise HTTPException(status_code=400, detail="Invalid password")
        
        if not user['mfa_enabled']:
            raise HTTPException(status_code=400, detail="MFA is not enabled")
        
        # Disable MFA
        users_db[user_id]['mfa_enabled'] = False
        users_db[user_id]['updated_at'] = datetime.now(timezone.utc)
        
        # Clean up MFA data
        if user_id in mfa_secrets:
            del mfa_secrets[user_id]
        if user_id in mfa_backup_codes:
            del mfa_backup_codes[user_id]
        
        return {'message': 'MFA disabled successfully'}
    
    async def login_with_mfa(self, login_data: LoginWithMFARequest) -> Dict[str, Any]:
        """Login with MFA code"""
        if not login_data.email or not login_data.password:
            raise HTTPException(status_code=400, detail="Email and password are required")
        
        # Find user by email
        user = None
        for u in users_db.values():
            if u['email'].lower() == login_data.email.lower():
                user = u
                break
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not self.verify_password(login_data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if account is approved
        if not user.get('registration_approved', True):
            raise HTTPException(status_code=403, detail="Account pending approval")
        
        # Verify MFA code
        if user['mfa_enabled']:
            user_id = user['id']
            
            # Check backup codes first
            if user_id in mfa_backup_codes and login_data.mfa_code in mfa_backup_codes[user_id]:
                # Use backup code
                mfa_backup_codes[user_id].remove(login_data.mfa_code)
            elif user_id in mfa_secrets:
                # Verify TOTP code
                totp = pyotp.TOTP(mfa_secrets[user_id])
                if not totp.verify(login_data.mfa_code):
                    raise HTTPException(status_code=401, detail="Invalid MFA code")
            else:
                raise HTTPException(status_code=400, detail="MFA not properly configured")
        
        # Update last login
        user['last_login'] = datetime.now(timezone.utc)
        user['updated_at'] = datetime.now(timezone.utc)
        
        # Generate tokens
        access_token = self.create_jwt_token(user['id'], user['email'])
        refresh_token = self.create_refresh_token(user['id'])
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'expires_in': JWT_EXPIRATION_HOURS * 3600,
            'user': User(**{k: v for k, v in user.items() if k != 'password_hash'})
        }
    
    # Admin functions
    async def get_all_users(self, admin_user_id: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get all users (admin only)"""
        if admin_user_id not in users_db or not users_db[admin_user_id].get('is_admin', False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        all_users = list(users_db.values())
        total = len(all_users)
        start = (page - 1) * limit
        end = start + limit
        users_page = all_users[start:end]
        
        return {
            'users': [User(**{k: v for k, v in user.items() if k != 'password_hash'}) for user in users_page],
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        }
    
    async def update_user_admin(self, admin_user_id: str, target_user_id: str, update_data: AdminUserUpdate) -> User:
        """Update user (admin only)"""
        if admin_user_id not in users_db or not users_db[admin_user_id].get('is_admin', False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if target_user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users_db[target_user_id]
        
        # Update fields
        if update_data.email is not None:
            user['email'] = update_data.email.lower()
        if update_data.subscription_tier is not None:
            user['subscription_tier'] = update_data.subscription_tier
        if update_data.credits is not None:
            user['credits'] = update_data.credits
        if update_data.registration_approved is not None:
            user['registration_approved'] = update_data.registration_approved
        if update_data.is_admin is not None:
            user['is_admin'] = update_data.is_admin
        
        user['updated_at'] = datetime.now(timezone.utc)
        
        return User(**{k: v for k, v in user.items() if k != 'password_hash'})
    
    async def get_pending_users(self, admin_user_id: str) -> List[User]:
        """Get users pending approval (admin only)"""
        if admin_user_id not in users_db or not users_db[admin_user_id].get('is_admin', False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        pending_users = [
            User(**{k: v for k, v in user.items() if k != 'password_hash'})
            for user in users_db.values()
            if not user.get('registration_approved', True)
        ]
        
        return pending_users
    
    async def get_system_stats(self, admin_user_id: str) -> Dict[str, Any]:
        """Get system statistics (admin only)"""
        if admin_user_id not in users_db or not users_db[admin_user_id].get('is_admin', False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        total_users = len(users_db)
        verified_users = sum(1 for user in users_db.values() if user.get('email_verified', False))
        mfa_users = sum(1 for user in users_db.values() if user.get('mfa_enabled', False))
        pending_users = sum(1 for user in users_db.values() if not user.get('registration_approved', True))
        
        return {
            'total_users': total_users,
            'verified_users': verified_users,
            'mfa_enabled_users': mfa_users,
            'pending_approval_users': pending_users,
            'active_verification_tokens': len(email_verification_tokens),
            'active_reset_tokens': len(password_reset_tokens)
        }

# Initialize auth service
auth_service = AuthService()
