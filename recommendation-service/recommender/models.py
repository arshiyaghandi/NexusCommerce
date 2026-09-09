from django.db import models


class UserInteraction(models.Model):
    """
    Tracks every meaningful user interaction with a product.
    This is the raw signal the ML engine learns from.

    interaction_type values:
      - 'view'     : user viewed the product page (weight=1)
      - 'cart'     : user added to cart (weight=3)
      - 'purchase' : user completed an order containing this product (weight=5)
    """
    INTERACTION_TYPES = [
        ('view',     'View'),
        ('cart',     'Add to Cart'),
        ('purchase', 'Purchase'),
    ]
    WEIGHTS = {'view': 1, 'cart': 3, 'purchase': 5}

    user_id    = models.CharField(max_length=128, db_index=True)
    product_id = models.BigIntegerField(db_index=True)
    interaction_type = models.CharField(max_length=16, choices=INTERACTION_TYPES)
    score      = models.FloatField(default=1.0)  # weighted score computed on save
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'product_id']),
        ]

    def save(self, *args, **kwargs):
        self.score = self.WEIGHTS.get(self.interaction_type, 1)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user_id} {self.interaction_type} product#{self.product_id}"


class ProductMeta(models.Model):
    """
    Lightweight product metadata cache synced from product-service.
    Used by the content-based algorithm for category-based similarity.
    """
    product_id   = models.BigIntegerField(unique=True, db_index=True)
    name         = models.CharField(max_length=256)
    category_id  = models.BigIntegerField(null=True, blank=True)
    category_name= models.CharField(max_length=128, blank=True, default='')
    price        = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Product#{self.product_id} [{self.category_name}]"
