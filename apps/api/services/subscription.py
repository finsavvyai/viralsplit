import os
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
import asyncio
import httpx

@dataclass
class SubscriptionPlan:
    id: str
    name: str
    price: int  # in cents
    credits_per_month: int
    features: List[str]
    ar_features: bool
    collaboration_features: bool
    max_uploads_per_month: int

@dataclass
class Subscription:
    id: str
    user_id: str
    plan_id: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    trial_end: Optional[datetime] = None

class LemonSqueezeService:
    def __init__(self):
        self.api_key = os.getenv('LEMONSQUEEZY_API_KEY')
        self.webhook_secret = os.getenv('LEMONSQUEEZY_WEBHOOK_SECRET')
        self.base_url = "https://api.lemonsqueezy.com/v1"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.api+json'
        }
        
        # Define subscription plans
        self.plans = {
            'free': SubscriptionPlan(
                id='free',
                name='Free',
                price=0,
                credits_per_month=100,
                features=['Basic video processing', 'Mobile app access', '3 platforms'],
                ar_features=False,
                collaboration_features=False,
                max_uploads_per_month=10
            ),
            'pro': SubscriptionPlan(
                id='pro',
                name='Pro Creator',
                price=1900,  # $19/month
                credits_per_month=1000,
                features=[
                    'Unlimited video processing', 
                    'All platforms', 
                    'AI enhancements',
                    'Magic editor',
                    'Content remixer',
                    'Analytics dashboard'
                ],
                ar_features=True,
                collaboration_features=False,
                max_uploads_per_month=100
            ),
            'team': SubscriptionPlan(
                id='team',
                name='Team',
                price=4900,  # $49/month
                credits_per_month=5000,
                features=[
                    'Everything in Pro',
                    'Team collaboration',
                    'Real-time editing',
                    'Advanced AR features',
                    'Priority support',
                    'Custom integrations'
                ],
                ar_features=True,
                collaboration_features=True,
                max_uploads_per_month=500
            ),
            'enterprise': SubscriptionPlan(
                id='enterprise',
                name='Enterprise',
                price=14900,  # $149/month
                credits_per_month=20000,
                features=[
                    'Everything in Team',
                    'White-label solution',
                    'API access',
                    'Custom AR models',
                    'Dedicated support',
                    'SLA guarantees'
                ],
                ar_features=True,
                collaboration_features=True,
                max_uploads_per_month=2000
            )
        }

    async def create_checkout_session(self, user_id: str, plan_id: str, success_url: str, cancel_url: str) -> Dict:
        """Create a checkout session for subscription"""
        try:
            plan = self.plans.get(plan_id)
            if not plan:
                raise ValueError(f"Invalid plan: {plan_id}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/checkouts",
                    headers=self.headers,
                    json={
                        "data": {
                            "type": "checkouts",
                            "attributes": {
                                "checkout_data": {
                                    "email": f"user_{user_id}@viralsplit.io",
                                    "custom": {
                                        "user_id": user_id,
                                        "plan_id": plan_id
                                    }
                                },
                                "product_options": {
                                    "name": plan.name,
                                    "description": f"ViralSplit {plan.name} - {', '.join(plan.features[:3])}",
                                    "receipt_button_text": "Access ViralSplit",
                                    "receipt_link_url": success_url
                                },
                                "checkout_options": {
                                    "embed": False,
                                    "media": False,
                                    "logo": True
                                },
                                "expires_at": (datetime.now() + timedelta(hours=1)).isoformat()
                            },
                            "relationships": {
                                "store": {
                                    "data": {
                                        "type": "stores",
                                        "id": os.getenv('LEMONSQUEEZY_STORE_ID', '1')
                                    }
                                },
                                "variant": {
                                    "data": {
                                        "type": "variants", 
                                        "id": self.get_variant_id(plan_id)
                                    }
                                }
                            }
                        }
                    }
                )
                
                if response.status_code == 201:
                    data = response.json()
                    return {
                        'success': True,
                        'checkout_url': data['data']['attributes']['url'],
                        'checkout_id': data['data']['id']
                    }
                else:
                    return {
                        'success': False,
                        'error': f"Checkout creation failed: {response.text}"
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to create checkout: {str(e)}"
            }

    async def get_subscription(self, subscription_id: str) -> Optional[Dict]:
        """Get subscription details"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/subscriptions/{subscription_id}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    return response.json()
                return None
                
        except Exception as e:
            print(f"Error fetching subscription: {e}")
            return None

    async def cancel_subscription(self, subscription_id: str, cancel_at_period_end: bool = True) -> Dict:
        """Cancel a subscription"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/subscriptions/{subscription_id}",
                    headers=self.headers,
                    json={
                        "data": {
                            "type": "subscriptions",
                            "id": subscription_id,
                            "attributes": {
                                "cancelled": not cancel_at_period_end,  # True = immediate, False = at period end
                            }
                        }
                    }
                )
                
                if response.status_code == 200:
                    return {'success': True, 'message': 'Subscription cancelled'}
                else:
                    return {'success': False, 'error': response.text}
                    
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def update_subscription(self, subscription_id: str, new_plan_id: str) -> Dict:
        """Update subscription to a different plan"""
        try:
            new_variant_id = self.get_variant_id(new_plan_id)
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/subscriptions/{subscription_id}",
                    headers=self.headers,
                    json={
                        "data": {
                            "type": "subscriptions",
                            "id": subscription_id,
                            "relationships": {
                                "variant": {
                                    "data": {
                                        "type": "variants",
                                        "id": new_variant_id
                                    }
                                }
                            }
                        }
                    }
                )
                
                if response.status_code == 200:
                    return {'success': True, 'message': 'Subscription updated'}
                else:
                    return {'success': False, 'error': response.text}
                    
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def handle_webhook(self, payload: Dict, signature: str) -> Dict:
        """Handle LemonSqueezy webhook events"""
        try:
            # Verify webhook signature
            if not self.verify_webhook_signature(payload, signature):
                return {'success': False, 'error': 'Invalid signature'}
            
            event_name = payload.get('meta', {}).get('event_name')
            subscription_data = payload.get('data', {})
            
            if event_name == 'subscription_created':
                return await self.handle_subscription_created(subscription_data)
            elif event_name == 'subscription_updated':
                return await self.handle_subscription_updated(subscription_data)
            elif event_name == 'subscription_cancelled':
                return await self.handle_subscription_cancelled(subscription_data)
            elif event_name == 'subscription_resumed':
                return await self.handle_subscription_resumed(subscription_data)
            elif event_name == 'subscription_expired':
                return await self.handle_subscription_expired(subscription_data)
            elif event_name == 'subscription_payment_success':
                return await self.handle_payment_success(subscription_data)
            elif event_name == 'subscription_payment_failed':
                return await self.handle_payment_failed(subscription_data)
            
            return {'success': True, 'message': f'Handled {event_name}'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def handle_subscription_created(self, data: Dict) -> Dict:
        """Handle new subscription creation"""
        try:
            attributes = data.get('attributes', {})
            custom_data = attributes.get('checkout_data', {}).get('custom', {})
            
            user_id = custom_data.get('user_id')
            plan_id = custom_data.get('plan_id')
            
            if not user_id or not plan_id:
                return {'success': False, 'error': 'Missing user_id or plan_id'}
            
            subscription = Subscription(
                id=data.get('id'),
                user_id=user_id,
                plan_id=plan_id,
                status=attributes.get('status'),
                current_period_start=datetime.fromisoformat(
                    attributes.get('billing_anchor').replace('Z', '+00:00')
                ),
                current_period_end=datetime.fromisoformat(
                    attributes.get('renews_at').replace('Z', '+00:00')
                ),
                cancel_at_period_end=attributes.get('ends_at') is not None,
                trial_end=None  # Add trial logic if needed
            )
            
            # Update user's subscription in database
            # This would integrate with your user database
            await self.update_user_subscription(user_id, subscription)
            
            # Grant plan credits to user
            plan = self.plans.get(plan_id)
            if plan:
                await self.grant_plan_credits(user_id, plan.credits_per_month)
            
            return {'success': True, 'subscription': subscription}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def handle_payment_success(self, data: Dict) -> Dict:
        """Handle successful subscription payment"""
        try:
            attributes = data.get('attributes', {})
            subscription_id = attributes.get('subscription_id')
            
            # Renew user's credits for the new billing period
            subscription_data = await self.get_subscription(subscription_id)
            if subscription_data:
                user_id = subscription_data['data']['attributes']['checkout_data']['custom']['user_id']
                plan_id = subscription_data['data']['attributes']['checkout_data']['custom']['plan_id']
                
                plan = self.plans.get(plan_id)
                if plan:
                    await self.grant_plan_credits(user_id, plan.credits_per_month)
            
            return {'success': True}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_variant_id(self, plan_id: str) -> str:
        """Get LemonSqueezy variant ID for plan"""
        # These would be your actual LemonSqueezy variant IDs
        variant_mapping = {
            'pro': os.getenv('LEMONSQUEEZY_PRO_VARIANT_ID', '1'),
            'team': os.getenv('LEMONSQUEEZY_TEAM_VARIANT_ID', '2'),
            'enterprise': os.getenv('LEMONSQUEEZY_ENTERPRISE_VARIANT_ID', '3')
        }
        return variant_mapping.get(plan_id, '1')

    def verify_webhook_signature(self, payload: Dict, signature: str) -> bool:
        """Verify webhook signature"""
        import hmac
        import hashlib
        
        expected_signature = hmac.new(
            self.webhook_secret.encode(),
            json.dumps(payload, separators=(',', ':')).encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)

    async def update_user_subscription(self, user_id: str, subscription: Subscription):
        """Update user subscription in database"""
        # This would integrate with your user database
        # For now, we'll use a simple in-memory store
        pass

    async def grant_plan_credits(self, user_id: str, credits: int):
        """Grant credits to user based on their plan"""
        # This would integrate with your credit system
        # You'd call your auth service to add credits
        pass

    def get_plan(self, plan_id: str) -> Optional[SubscriptionPlan]:
        """Get plan details"""
        return self.plans.get(plan_id)

    def get_all_plans(self) -> List[SubscriptionPlan]:
        """Get all available plans"""
        return list(self.plans.values())

    async def get_user_subscription_status(self, user_id: str) -> Dict:
        """Get user's current subscription status"""
        # This would query your database for user's subscription
        # For now, return a mock response
        return {
            'has_subscription': False,
            'plan_id': 'free',
            'status': 'active',
            'credits_remaining': 100,
            'features': self.plans['free'].features,
            'ar_features_enabled': False,
            'collaboration_enabled': False
        }

# Create global instance
subscription_service = LemonSqueezeService()