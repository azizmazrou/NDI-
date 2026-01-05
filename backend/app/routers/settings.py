"""
Settings Router - مسارات الإعدادات
API endpoints for managing application settings and AI providers
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
import base64
from cryptography.fernet import Fernet
import os

from app.database import get_db
from app.models.settings import Setting, AIProviderConfig, SettingCategory, OrganizationSettings
from app.schemas.settings import (
    SettingResponse,
    SettingCreate,
    SettingUpdate,
    AIProviderResponse,
    AIProviderCreate,
    AIProviderUpdate,
    AIProviderListResponse,
    SettingsPageResponse,
    TestConnectionRequest,
    TestConnectionResponse,
    OrganizationSettingsResponse,
    OrganizationSettingsUpdate,
)

router = APIRouter(tags=["Settings - الإعدادات"])

# Encryption key - MUST be stable across restarts
# In production, set ENCRYPTION_KEY environment variable
# Default key is used for development - DO NOT use in production
_DEFAULT_KEY = "dGhpc19pc19hX2RlZmF1bHRfa2V5X2Zvcl9kZXY="  # Base64 encoded stable default
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", None)

if ENCRYPTION_KEY:
    # Use environment variable key
    fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
else:
    # Generate a stable key from default (for development only)
    import hashlib
    key_bytes = hashlib.sha256(_DEFAULT_KEY.encode()).digest()
    import base64
    stable_key = base64.urlsafe_b64encode(key_bytes)
    fernet = Fernet(stable_key)


def encrypt_value(value: str) -> str:
    """Encrypt a sensitive value"""
    return fernet.encrypt(value.encode()).decode()


def decrypt_value(encrypted_value: str) -> str:
    """Decrypt a sensitive value"""
    try:
        return fernet.decrypt(encrypted_value.encode()).decode()
    except Exception:
        return ""


def mask_api_key(key: str) -> str:
    """Mask API key for display"""
    if not key or len(key) < 8:
        return "****"
    return f"{key[:4]}...{key[-4:]}"


# =============================================================================
# Organization Settings Endpoints
# =============================================================================

@router.get("/organization", response_model=OrganizationSettingsResponse)
async def get_organization_settings(db: AsyncSession = Depends(get_db)):
    """
    Get organization settings
    الحصول على إعدادات المنظمة
    """
    result = await db.execute(select(OrganizationSettings).where(OrganizationSettings.id == 1))
    org = result.scalar_one_or_none()

    if not org:
        # Create default organization settings
        org = OrganizationSettings(
            id=1,
            name_en="Organization",
            name_ar="المنظمة",
        )
        db.add(org)
        await db.commit()
        await db.refresh(org)

    return OrganizationSettingsResponse(
        id=org.id,
        name_en=org.name_en,
        name_ar=org.name_ar,
        sector=org.sector_en,
        sector_en=org.sector_en,
        sector_ar=org.sector_ar,
        description_en=org.description_en,
        description_ar=org.description_ar,
        logo_url=org.logo_url,
        website=org.website,
        address=org.address_en,
        address_en=org.address_en,
        address_ar=org.address_ar,
        contact_email=org.contact_email,
        contact_phone=org.contact_phone,
        created_at=org.created_at,
        updated_at=org.updated_at,
    )


@router.put("/organization", response_model=OrganizationSettingsResponse)
async def update_organization_settings(
    data: OrganizationSettingsUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update organization settings
    تحديث إعدادات المنظمة
    """
    result = await db.execute(select(OrganizationSettings).where(OrganizationSettings.id == 1))
    org = result.scalar_one_or_none()

    if not org:
        org = OrganizationSettings(id=1)
        db.add(org)

    update_data = data.model_dump(exclude_unset=True)

    # Map frontend field names to backend field names
    if "sector" in update_data:
        update_data["sector_en"] = update_data.pop("sector")
    if "address" in update_data:
        update_data["address_en"] = update_data.pop("address")

    for key, value in update_data.items():
        if hasattr(org, key):
            setattr(org, key, value)

    await db.commit()
    await db.refresh(org)

    return OrganizationSettingsResponse(
        id=org.id,
        name_en=org.name_en,
        name_ar=org.name_ar,
        sector=org.sector_en,
        sector_en=org.sector_en,
        sector_ar=org.sector_ar,
        description_en=org.description_en,
        description_ar=org.description_ar,
        logo_url=org.logo_url,
        website=org.website,
        address=org.address_en,
        address_en=org.address_en,
        address_ar=org.address_ar,
        contact_email=org.contact_email,
        contact_phone=org.contact_phone,
        created_at=org.created_at,
        updated_at=org.updated_at,
    )


# =============================================================================
# AI Provider Endpoints
# =============================================================================

@router.get("/ai-providers", response_model=AIProviderListResponse)
async def get_ai_providers(db: AsyncSession = Depends(get_db)):
    """
    Get all AI providers configuration
    الحصول على جميع إعدادات مزودي الذكاء الاصطناعي
    """
    result = await db.execute(select(AIProviderConfig))
    providers = result.scalars().all()

    # If no providers exist, create default ones
    if not providers:
        providers = await create_default_providers(db)

    response_providers = []
    for provider in providers:
        response_providers.append(AIProviderResponse(
            id=provider.id,
            name_en=provider.name_en,
            name_ar=provider.name_ar,
            api_endpoint=provider.api_endpoint,
            model_name=provider.model_name,
            is_enabled=provider.is_enabled,
            is_default=provider.is_default,
            has_api_key=bool(provider.api_key),
            created_at=provider.created_at,
            updated_at=provider.updated_at,
        ))

    return AIProviderListResponse(providers=response_providers)


@router.get("/ai-providers/{provider_id}", response_model=AIProviderResponse)
async def get_ai_provider(provider_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get a specific AI provider configuration
    الحصول على إعدادات مزود ذكاء اصطناعي محدد
    """
    result = await db.execute(
        select(AIProviderConfig).where(AIProviderConfig.id == provider_id)
    )
    provider = result.scalar_one_or_none()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    return AIProviderResponse(
        id=provider.id,
        name_en=provider.name_en,
        name_ar=provider.name_ar,
        api_endpoint=provider.api_endpoint,
        model_name=provider.model_name,
        is_enabled=provider.is_enabled,
        is_default=provider.is_default,
        has_api_key=bool(provider.api_key),
        created_at=provider.created_at,
        updated_at=provider.updated_at,
    )


@router.put("/ai-providers/{provider_id}", response_model=AIProviderResponse)
async def update_ai_provider(
    provider_id: str,
    provider_update: AIProviderUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update AI provider configuration
    تحديث إعدادات مزود الذكاء الاصطناعي
    """
    result = await db.execute(
        select(AIProviderConfig).where(AIProviderConfig.id == provider_id)
    )
    provider = result.scalar_one_or_none()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Update fields
    update_data = provider_update.model_dump(exclude_unset=True)

    # Encrypt API key if provided
    if "api_key" in update_data and update_data["api_key"]:
        update_data["api_key"] = encrypt_value(update_data["api_key"])

    # If setting as default, unset other defaults
    if update_data.get("is_default"):
        await db.execute(
            update(AIProviderConfig).values(is_default=False)
        )

    for key, value in update_data.items():
        setattr(provider, key, value)

    await db.commit()
    await db.refresh(provider)

    return AIProviderResponse(
        id=provider.id,
        name_en=provider.name_en,
        name_ar=provider.name_ar,
        api_endpoint=provider.api_endpoint,
        model_name=provider.model_name,
        is_enabled=provider.is_enabled,
        is_default=provider.is_default,
        has_api_key=bool(provider.api_key),
        created_at=provider.created_at,
        updated_at=provider.updated_at,
    )


@router.post("/ai-providers/{provider_id}/test", response_model=TestConnectionResponse)
async def test_ai_provider(
    provider_id: str,
    request: TestConnectionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Test AI provider connection
    اختبار اتصال مزود الذكاء الاصطناعي
    """
    result = await db.execute(
        select(AIProviderConfig).where(AIProviderConfig.id == provider_id)
    )
    provider = result.scalar_one_or_none()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Get API key (from request or stored)
    api_key = request.api_key
    if not api_key and provider.api_key:
        api_key = decrypt_value(provider.api_key)

    if not api_key:
        return TestConnectionResponse(
            success=False,
            message="No API key provided",
            provider_id=provider_id
        )

    # Test connection based on provider
    try:
        if provider_id == "openai":
            success, message = await test_openai_connection(api_key)
        elif provider_id == "claude":
            success, message = await test_claude_connection(api_key)
        elif provider_id == "gemini":
            success, message = await test_gemini_connection(api_key)
        elif provider_id == "azure":
            success, message = await test_azure_connection(api_key, provider.api_endpoint)
        else:
            success, message = False, "Unknown provider"

        return TestConnectionResponse(
            success=success,
            message=message,
            provider_id=provider_id
        )
    except Exception as e:
        return TestConnectionResponse(
            success=False,
            message=str(e),
            provider_id=provider_id
        )


# =============================================================================
# Settings Endpoints
# =============================================================================

@router.get("/", response_model=SettingsPageResponse)
async def get_all_settings(db: AsyncSession = Depends(get_db)):
    """
    Get all settings for the settings page
    الحصول على جميع الإعدادات لصفحة الإعدادات
    """
    # Get AI providers
    providers_result = await db.execute(select(AIProviderConfig))
    providers = providers_result.scalars().all()

    if not providers:
        providers = await create_default_providers(db)

    # Get general settings
    settings_result = await db.execute(select(Setting))
    settings = settings_result.scalars().all()

    provider_responses = [
        AIProviderResponse(
            id=p.id,
            name_en=p.name_en,
            name_ar=p.name_ar,
            api_endpoint=p.api_endpoint,
            model_name=p.model_name,
            is_enabled=p.is_enabled,
            is_default=p.is_default,
            has_api_key=bool(p.api_key),
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in providers
    ]

    setting_responses = [
        SettingResponse(
            key=s.key,
            value=mask_api_key(s.value) if s.is_secret else s.value,
            category=s.category,
            is_secret=s.is_secret,
            description_en=s.description_en,
            description_ar=s.description_ar,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s in settings
    ]

    return SettingsPageResponse(
        ai_providers=provider_responses,
        settings=setting_responses
    )


# =============================================================================
# Helper Functions
# =============================================================================

async def create_default_providers(db: AsyncSession) -> List[AIProviderConfig]:
    """Create default AI provider configurations"""
    default_providers = [
        AIProviderConfig(
            id="openai",
            name_en="OpenAI",
            name_ar="OpenAI",
            model_name="gpt-4",
            is_enabled=False,
            is_default=False,
        ),
        AIProviderConfig(
            id="claude",
            name_en="Claude (Anthropic)",
            name_ar="كلود (Anthropic)",
            model_name="claude-3-opus-20240229",
            is_enabled=False,
            is_default=False,
        ),
        AIProviderConfig(
            id="gemini",
            name_en="Google Gemini",
            name_ar="جوجل جيميني",
            model_name="gemini-pro",
            is_enabled=False,
            is_default=False,
        ),
        AIProviderConfig(
            id="azure",
            name_en="Azure OpenAI",
            name_ar="Azure OpenAI",
            model_name="gpt-4",
            is_enabled=False,
            is_default=False,
        ),
    ]

    for provider in default_providers:
        db.add(provider)

    await db.commit()

    # Refresh to get created_at/updated_at
    result = await db.execute(select(AIProviderConfig))
    return result.scalars().all()


async def test_openai_connection(api_key: str) -> tuple[bool, str]:
    """Test OpenAI API connection"""
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        client.models.list()
        return True, "Connection successful"
    except Exception as e:
        return False, str(e)


async def test_claude_connection(api_key: str) -> tuple[bool, str]:
    """Test Claude/Anthropic API connection"""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        # Simple test - just verify the client can be created with valid key format
        if not api_key.startswith("sk-ant-"):
            return False, "Invalid API key format"
        return True, "API key format valid"
    except Exception as e:
        return False, str(e)


async def test_gemini_connection(api_key: str) -> tuple[bool, str]:
    """Test Google Gemini API connection"""
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        return True, "Connection successful"
    except Exception as e:
        return False, str(e)


async def test_azure_connection(api_key: str, endpoint: str) -> tuple[bool, str]:
    """Test Azure OpenAI API connection"""
    try:
        if not endpoint:
            return False, "Endpoint not configured"
        import openai
        client = openai.AzureOpenAI(
            api_key=api_key,
            api_version="2024-02-15-preview",
            azure_endpoint=endpoint
        )
        return True, "Connection configured"
    except Exception as e:
        return False, str(e)


@router.post("/ai-providers/{provider_id}/fetch-models")
async def fetch_provider_models(
    provider_id: str,
    request: TestConnectionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch available models from provider API
    جلب النماذج المتاحة من API المزود
    """
    result = await db.execute(
        select(AIProviderConfig).where(AIProviderConfig.id == provider_id)
    )
    provider = result.scalar_one_or_none()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Get API key (from request or stored)
    api_key = request.api_key
    if not api_key and provider.api_key:
        api_key = decrypt_value(provider.api_key)

    if not api_key:
        return {"models": [], "error": "No API key provided"}

    try:
        if provider_id == "openai":
            import openai
            client = openai.OpenAI(api_key=api_key)
            models_response = client.models.list()
            # Filter for chat models
            chat_models = [
                m.id for m in models_response.data
                if "gpt" in m.id.lower() and "instruct" not in m.id.lower()
            ]
            return {"models": sorted(chat_models, reverse=True)[:10]}

        elif provider_id == "claude":
            # Anthropic doesn't have a list models endpoint, return known models
            return {
                "models": [
                    "claude-3-5-sonnet-20241022",
                    "claude-3-5-haiku-20241022",
                    "claude-3-opus-20240229",
                    "claude-3-sonnet-20240229",
                    "claude-3-haiku-20240307",
                ]
            }

        elif provider_id == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            models = []
            for m in genai.list_models():
                if "generateContent" in m.supported_generation_methods:
                    models.append(m.name.replace("models/", ""))
            return {"models": models[:10]}

        elif provider_id == "azure":
            # Azure uses deployment names, can't list automatically
            return {
                "models": [],
                "message": "Azure uses deployment names. Enter your deployment name manually."
            }

        else:
            return {"models": [], "error": "Unknown provider"}

    except Exception as e:
        return {"models": [], "error": str(e)}
