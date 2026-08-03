from django.urls import path
from .views import RecommendationView

urlpatterns = [
    path('', RecommendationView.as_view(), name='get_recommendations'),
]
