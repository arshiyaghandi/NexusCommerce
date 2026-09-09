"""
Recommendation Service — API Views
====================================
Endpoints:
  POST /api/recommendations/track      ← ثبت تعامل کاربر
  GET  /api/recommendations/           ← دریافت توصیه‌ها
  POST /api/recommendations/sync       ← sync محصولات از product-service
"""
import logging
import os

import httpx
import jwt as pyjwt
import pandas as pd
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .ml_engine import get_recommendations
from .models import ProductMeta, UserInteraction

logger = logging.getLogger(__name__)

KEYCLOAK_REALM_URL = os.getenv(
    "KEYCLOAK_REALM_URL",
    "http://localhost:8081/realms/nexus-realm",
)
PRODUCT_SERVICE_URL = os.getenv(
    "PRODUCT_SERVICE_URL",
    "http://localhost:8085/api/products",
)


# ─────────────────────────────────────────────────────────────────────────────
# Helper: extract user_id from JWT in cookie or Authorization header
# ─────────────────────────────────────────────────────────────────────────────

def extract_user_id(request) -> str | None:
    """
    Extracts the Keycloak `sub` (user UUID) from the incoming JWT.
    Supports both:
      - Cookie: NEXUS_TOKEN=<jwt>
      - Header: Authorization: Bearer <jwt>
    Token is decoded WITHOUT verifying signature here (verification is done
    at the API gateway level). Only the `sub` claim is read.
    """
    token = None

    # 1. Cookie
    cookie_token = request.COOKIES.get("NEXUS_TOKEN")
    if cookie_token:
        token = cookie_token

    # 2. Authorization header
    if token is None:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if token is None:
        return None

    try:
        payload = pyjwt.decode(token, options={"verify_signature": False})
        return payload.get("sub")
    except Exception as e:
        logger.warning("Failed to decode JWT: %s", e)
        return None


def load_interactions_df() -> pd.DataFrame:
    """Load all interactions from SQLite into a pandas DataFrame."""
    qs = UserInteraction.objects.values("user_id", "product_id", "score")
    if not qs.exists():
        return pd.DataFrame(columns=["user_id", "product_id", "score"])
    return pd.DataFrame.from_records(qs)


def load_products_df() -> pd.DataFrame:
    """Load product metadata from SQLite into a pandas DataFrame."""
    qs = ProductMeta.objects.values("product_id", "category_id", "category_name", "price")
    if not qs.exists():
        return pd.DataFrame(columns=["product_id", "category_id", "category_name", "price"])
    return pd.DataFrame.from_records(qs)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/recommendations/track
# ─────────────────────────────────────────────────────────────────────────────

class TrackInteractionView(APIView):
    """
    ثبت یک تعامل کاربر با محصول.

    Body (JSON):
      {
        "productId": 42,
        "interactionType": "view" | "cart" | "purchase"
      }

    user_id از JWT استخراج می‌شه — کلاینت نباید userId بفرسته.
    """

    def post(self, request):
        user_id = extract_user_id(request)
        if not user_id:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        product_id = request.data.get("productId")
        interaction_type = request.data.get("interactionType", "view").lower()

        if not product_id:
            return Response(
                {"error": "productId is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_types = {"view", "cart", "purchase"}
        if interaction_type not in valid_types:
            return Response(
                {"error": f"interactionType must be one of: {valid_types}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            interaction = UserInteraction.objects.create(
                user_id=user_id,
                product_id=int(product_id),
                interaction_type=interaction_type,
            )
            logger.info(
                "Tracked: user=%s product=%s type=%s score=%.1f",
                user_id, product_id, interaction_type, interaction.score,
            )
            return Response(
                {"message": "Interaction tracked", "score": interaction.score},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error("Failed to track interaction: %s", e)
            return Response(
                {"error": "Failed to track interaction"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/recommendations/
# ─────────────────────────────────────────────────────────────────────────────

class RecommendationView(APIView):
    """
    دریافت توصیه‌های شخصی‌سازی‌شده برای کاربر جاری.

    Query params:
      - topN (int, default=10): تعداد توصیه‌ها
      - userId (str, optional): override — فقط برای admin/testing

    الگوریتم:
      - اگه >= 3 تعامل داشت → SVD Collaborative + Content-Based (Hybrid)
      - اگه 1–2 تعامل داشت → Content-Based
      - اگه هیچ تعاملی نداشت → Trending (پرفروش‌ترین‌ها)
    """

    def get(self, request):
        user_id = extract_user_id(request)

        # در صورت نبود JWT یا override از query param
        if not user_id:
            user_id = request.query_params.get("userId")

        top_n = int(request.query_params.get("topN", 10))
        top_n = max(1, min(top_n, 50))  # clamp 1–50

        interactions_df = load_interactions_df()
        products_df     = load_products_df()

        if user_id:
            recommendations = get_recommendations(
                user_id=user_id,
                interactions_df=interactions_df,
                products_df=products_df,
                top_n=top_n,
            )
        else:
            # Unauthenticated user → Trending
            from .ml_engine import trending_recommend
            recommendations = trending_recommend(interactions_df, top_n=top_n)

        return Response(recommendations, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/recommendations/sync
# ─────────────────────────────────────────────────────────────────────────────

class SyncProductsView(APIView):
    """
    محصولات را از product-service دریافت و در SQLite ذخیره می‌کند.

    این endpoint باید به‌صورت دوره‌ای فراخوانی شود (مثلاً هر 10 دقیقه یک‌بار
    توسط یک cronjob یا از طریق یک Kafka consumer آینده).

    Body (optional JSON array for direct push):
      [{"id": 1, "name": "...", "categoryId": 2, "categoryName": "...", "price": 99.9}, ...]

    اگه body خالی باشه، مستقیماً از product-service fetch می‌کنیم.
    """

    def post(self, request):
        products_data = request.data if isinstance(request.data, list) else None

        if not products_data:
            # Fetch from product-service
            try:
                resp = httpx.get(PRODUCT_SERVICE_URL, timeout=5.0)
                resp.raise_for_status()
                products_data = resp.json()
            except Exception as e:
                logger.error("Failed to fetch products from product-service: %s", e)
                return Response(
                    {"error": f"Could not reach product-service: {e}"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        if not isinstance(products_data, list):
            return Response(
                {"error": "Expected a JSON array of products"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upserted = 0
        for p in products_data:
            pid = p.get("id") or p.get("productId")
            if not pid:
                continue
            ProductMeta.objects.update_or_create(
                product_id=int(pid),
                defaults={
                    "name": p.get("name", ""),
                    "category_id": p.get("categoryId"),
                    "category_name": p.get("categoryName", ""),
                    "price": p.get("price"),
                },
            )
            upserted += 1

        logger.info("Synced %d products into ProductMeta", upserted)
        return Response({"synced": upserted}, status=status.HTTP_200_OK)
