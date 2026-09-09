"""
NexusCommerce Recommendation Engine
=====================================
الگوریتم‌های پیاده‌سازی‌شده:

1. **SVD Collaborative Filtering (scipy)**
   - User-item interaction matrix می‌سازیم (user × product → weighted score)
   - SVD روی ماتریس اجرا می‌کنیم تا latent factors استخراج بشه
   - برای هر کاربر، predicted score رو برای همه productهای ندیده حساب می‌کنیم
   - نتیجه: "کاربرانی که رفتاری مثل شما داشتند این محصولات رو خریدند"

2. **Content-Based Filtering (TF-IDF + cosine similarity)**
   - از category_id محصولاتی که کاربر باهاشون تعامل داشته استفاده می‌کنیم
   - محصولات با category مشابه رو recommend می‌کنیم
   - نتیجه: "بر اساس دسته‌بندی علاقه‌مندی‌های شما"

3. **Hybrid (ترکیب)**
   - اگه interaction کافی وجود داشت: SVD (دقیق‌تر)
   - اگه کاربر جدید بود (cold-start): Content-Based
   - در هر صورت، نتایج deduplicate و مرتب می‌شن
"""

import logging
from typing import Optional

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger(__name__)


# ── Constants ─────────────────────────────────────────────────────────────────

SVD_FACTORS = 20          # تعداد latent factor در SVD (بیشتر = دقیق‌تر ولی کندتر)
MIN_INTERACTIONS = 3      # حداقل interaction برای استفاده از SVD
DEFAULT_TOP_N = 10        # تعداد پیش‌فرض recommendation


# ── 1. SVD Collaborative Filtering ────────────────────────────────────────────

def build_interaction_matrix(interactions_df: pd.DataFrame) -> tuple:
    """
    از DataFrame خام، sparse user-item matrix می‌سازیم.

    Returns:
        (matrix, user_encoder, item_encoder)
        matrix: shape (n_users, n_items)
    """
    user_enc = LabelEncoder().fit(interactions_df["user_id"])
    item_enc = LabelEncoder().fit(interactions_df["product_id"])

    user_idx = user_enc.transform(interactions_df["user_id"])
    item_idx = item_enc.transform(interactions_df["product_id"])
    scores   = interactions_df["score"].values.astype(float)

    # اگه یه کاربر چند بار با یه محصول تعامل داشت، scoreها جمع می‌شن
    matrix = csr_matrix(
        (scores, (user_idx, item_idx)),
        shape=(len(user_enc.classes_), len(item_enc.classes_))
    )
    return matrix, user_enc, item_enc


def svd_recommend(
    target_user: str,
    interactions_df: pd.DataFrame,
    top_n: int = DEFAULT_TOP_N,
) -> list[dict]:
    """
    SVD-based collaborative filtering.

    الگوریتم:
      1. User-item matrix بساز
      2. SVD تجزیه کن: M ≈ U · Σ · Vᵀ
      3. برای target_user، predicted scores حساب کن: Û = U · Σ · Vᵀ
      4. productهایی که کاربر ندیده رو با بالاترین score برگردون

    Returns: list of {"productId": int, "score": float, "reason": str}
    """
    if target_user not in interactions_df["user_id"].values:
        return []

    matrix, user_enc, item_enc = build_interaction_matrix(interactions_df)

    # تعداد factor نباید از ابعاد ماتریس بیشتر بشه
    k = min(SVD_FACTORS, min(matrix.shape) - 1)
    if k < 1:
        return []

    try:
        U, sigma, Vt = svds(matrix.astype(float), k=k)
    except Exception as e:
        logger.warning("SVD failed: %s", e)
        return []

    # Reconstruct full predicted rating matrix
    predicted = np.dot(np.dot(U, np.diag(sigma)), Vt)  # shape: (n_users, n_items)

    user_idx = user_enc.transform([target_user])[0]
    user_predictions = predicted[user_idx]               # shape: (n_items,)

    # محصولاتی که کاربر قبلاً باهاشون تعامل داشته رو حذف می‌کنیم
    seen_mask = matrix[user_idx].toarray().flatten() > 0
    user_predictions[seen_mask] = -np.inf

    # بهترین n محصول
    top_indices = np.argsort(user_predictions)[::-1][:top_n]
    product_ids = item_enc.inverse_transform(top_indices)
    scores      = user_predictions[top_indices]

    results = []
    for pid, s in zip(product_ids, scores):
        if s == -np.inf:
            break
        results.append({
            "productId": int(pid),
            "score": round(float(s), 4),
            "reason": "Customers with similar taste also liked this",
        })
    return results


# ── 2. Content-Based Filtering ────────────────────────────────────────────────

def content_based_recommend(
    target_user: str,
    interactions_df: pd.DataFrame,
    products_df: pd.DataFrame,
    top_n: int = DEFAULT_TOP_N,
) -> list[dict]:
    """
    Content-based recommendation بر اساس category.

    الگوریتم:
      1. categoryهایی که کاربر باهاشون تعامل داشته (weighted by score) پیدا کن
      2. برای همه محصولات، feature vector بساز (category one-hot)
      3. Cosine similarity بین "user profile vector" و هر محصول حساب کن
      4. محصولاتی که کاربر ندیده رو با بالاترین similarity برگردون

    Returns: list of {"productId": int, "score": float, "reason": str}
    """
    if products_df.empty:
        return []

    user_interactions = interactions_df[interactions_df["user_id"] == target_user]
    seen_products = set(user_interactions["product_id"].values)

    # One-hot encode categories
    all_categories = products_df["category_id"].fillna(-1).astype(str).unique()
    cat_enc = LabelEncoder().fit(all_categories)

    product_cats = products_df["category_id"].fillna(-1).astype(str)
    cat_indices  = cat_enc.transform(product_cats)

    n_cats = len(cat_enc.classes_)
    n_products = len(products_df)
    product_matrix = np.zeros((n_products, n_cats))
    for i, ci in enumerate(cat_indices):
        product_matrix[i, ci] = 1.0

    # User profile = weighted average of seen products' category vectors
    if user_interactions.empty:
        # Cold-start: same weight for all categories (uniform)
        user_profile = product_matrix.mean(axis=0, keepdims=True)
    else:
        seen_df = products_df[products_df["product_id"].isin(seen_products)]
        if seen_df.empty:
            user_profile = product_matrix.mean(axis=0, keepdims=True)
        else:
            seen_idx = seen_df.index.tolist()
            # Weight categories by the scores in user interactions
            weights = []
            for pid in seen_df["product_id"]:
                w = user_interactions[user_interactions["product_id"] == pid]["score"].sum()
                weights.append(w if w > 0 else 1.0)
            weights = np.array(weights, dtype=float)
            weights /= weights.sum()
            user_profile = (product_matrix[seen_idx] * weights[:, None]).sum(axis=0, keepdims=True)

    similarities = cosine_similarity(user_profile, product_matrix).flatten()

    # حذف productهای دیده‌شده
    for i, pid in enumerate(products_df["product_id"].values):
        if pid in seen_products:
            similarities[i] = -1.0

    top_indices = np.argsort(similarities)[::-1][:top_n]
    results = []
    for i in top_indices:
        sim = similarities[i]
        if sim < 0:
            break
        pid = int(products_df.iloc[i]["product_id"])
        cat = products_df.iloc[i].get("category_name", "")
        results.append({
            "productId": pid,
            "score": round(float(sim), 4),
            "reason": f"Based on your interest in {cat}" if cat else "Based on your browsing history",
        })
    return results


# ── 3. Trending (fallback برای cold-start کامل) ───────────────────────────────

def trending_recommend(
    interactions_df: pd.DataFrame,
    exclude_products: Optional[set] = None,
    top_n: int = DEFAULT_TOP_N,
) -> list[dict]:
    """
    محبوب‌ترین محصولات در کل سایت رو برمی‌گردونه.
    این fallback وقتیه که کاربر هیچ تعاملی نداشته (brand new user).
    """
    if interactions_df.empty:
        return []

    exclude = exclude_products or set()
    popularity = (
        interactions_df[~interactions_df["product_id"].isin(exclude)]
        .groupby("product_id")["score"]
        .sum()
        .sort_values(ascending=False)
        .head(top_n)
    )

    return [
        {
            "productId": int(pid),
            "score": round(float(s), 4),
            "reason": "Trending on NexusCommerce",
        }
        for pid, s in popularity.items()
    ]


# ── 4. Hybrid Engine ──────────────────────────────────────────────────────────

def get_recommendations(
    user_id: str,
    interactions_df: pd.DataFrame,
    products_df: pd.DataFrame,
    top_n: int = DEFAULT_TOP_N,
) -> list[dict]:
    """
    Hybrid recommendation engine.

    تصمیم‌گیری:
      - اگه کاربر >= MIN_INTERACTIONS تعامل داشته → SVD (collaborative)
      - اگه کمتر داشته ولی بازهم تعاملی بود → Content-based
      - اگه هیچ تعاملی نداشت (کاربر کاملاً جدید) → Trending

    نتایج SVD و Content-based با هم ترکیب می‌شن (union + dedup + re-rank).
    """
    user_interactions = interactions_df[interactions_df["user_id"] == user_id]
    n_interactions = len(user_interactions)

    logger.info("Generating recommendations for user=%s (interactions=%d)", user_id, n_interactions)

    # ── Case 1: کاربر کاملاً جدید ──────────────────────────────────────────
    if n_interactions == 0:
        logger.info("Cold-start user=%s → Trending fallback", user_id)
        return trending_recommend(interactions_df, top_n=top_n)

    # ── Case 2: تعامل کم → فقط Content-based ──────────────────────────────
    if n_interactions < MIN_INTERACTIONS:
        logger.info("Sparse user=%s → Content-based only", user_id)
        results = content_based_recommend(user_id, interactions_df, products_df, top_n=top_n)
        if not results:
            # خود این کاربر هم در products_df نیست → Trending
            return trending_recommend(interactions_df, top_n=top_n)
        return results

    # ── Case 3: تعامل کافی → Hybrid SVD + Content-based ──────────────────
    logger.info("Active user=%s → Hybrid SVD + Content-based", user_id)
    svd_results   = svd_recommend(user_id, interactions_df, top_n=top_n)
    cbf_results   = content_based_recommend(user_id, interactions_df, products_df, top_n=top_n)

    # Merge: SVD نتایج وزن ۰.۷ می‌گیره، Content-based ۰.۳
    seen_ids = set()
    merged = []

    for r in svd_results:
        pid = r["productId"]
        if pid not in seen_ids:
            seen_ids.add(pid)
            merged.append({**r, "score": round(r["score"] * 0.7, 4)})

    for r in cbf_results:
        pid = r["productId"]
        if pid not in seen_ids:
            seen_ids.add(pid)
            merged.append({**r, "score": round(r["score"] * 0.3, 4)})

    # Re-sort by final score
    merged.sort(key=lambda x: x["score"], reverse=True)
    return merged[:top_n]
