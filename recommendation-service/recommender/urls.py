from django.urls import path
from .views import RecommendationView, TrackInteractionView, SyncProductsView

urlpatterns = [
    path('',       RecommendationView.as_view(),   name='get_recommendations'),
    path('track/', TrackInteractionView.as_view(),  name='track_interaction'),
    path('sync/',  SyncProductsView.as_view(),      name='sync_products'),
]
