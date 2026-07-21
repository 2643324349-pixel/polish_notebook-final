"""Supabase account deletion via Admin API."""

from __future__ import annotations

import os

import httpx


class AccountDeletionError(Exception):
    pass


def _supabase_url() -> str:
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
    return url.rstrip("/")


def _service_role_key() -> str:
    return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()


def _ensure_configured() -> tuple[str, str]:
    url = _supabase_url()
    key = _service_role_key()
    if not url or not key:
        raise AccountDeletionError("Supabase admin credentials are not configured")
    return url, key


async def verify_user_token(access_token: str) -> str:
    """Validate the caller JWT and return the authenticated user id."""
    if not access_token.strip():
        raise AccountDeletionError("Missing access token")

    base_url, service_key = _ensure_configured()

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{base_url}/auth/v1/user",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {access_token}",
            },
        )

    if response.status_code != 200:
        raise AccountDeletionError("Invalid or expired session")

    user_id = response.json().get("id")
    if not user_id:
        raise AccountDeletionError("Could not resolve authenticated user")

    return str(user_id)


async def delete_user_account(user_id: str, access_token: str) -> None:
    """Delete the auth user; notebooks/sheets/rows cascade via FK constraints."""
    token_user_id = await verify_user_token(access_token)
    if token_user_id != user_id:
        raise AccountDeletionError("User ID does not match authenticated session")

    base_url, service_key = _ensure_configured()

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.delete(
            f"{base_url}/auth/v1/admin/users/{user_id}",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
            },
        )

    if response.status_code not in (200, 204):
        detail = response.text.strip() or response.reason_phrase
        raise AccountDeletionError(f"Failed to delete account: {detail}")
