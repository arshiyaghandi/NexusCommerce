from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class RecommendationView(APIView):
    def get(self, request, *args, **kwargs):
        # user_id = request.query_params.get('userId')
        
        # Here you would typically load a trained model and 
        # predict the top N products for the given user_id.
        # For demonstration, we'll return a static list of recommendations.
        
        recommendations = [
            {"productId": 1, "score": 0.95, "reason": "Based on your recent views"},
            {"productId": 2, "score": 0.88, "reason": "Trending in your area"},
            {"productId": 4, "score": 0.75, "reason": "Customers also bought this"}
        ]
        
        return Response(recommendations, status=status.HTTP_200_OK)
