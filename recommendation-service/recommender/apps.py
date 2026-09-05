import os
import sys
from django.apps import AppConfig

class RecommenderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'recommender'

    def ready(self):
        # Prevent registration during migrations or collectstatic
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv:
            import py_eureka_client.eureka_client as eureka_client
            
            EUREKA_SERVER = os.getenv("EUREKA_SERVER", "http://localhost:8761/eureka")
            SERVICE_PORT = int(os.getenv("PORT", "8092"))
            SERVICE_NAME = "recommendation-service"
            
            try:
                eureka_client.init(
                    eureka_server=EUREKA_SERVER,
                    app_name=SERVICE_NAME,
                    instance_port=SERVICE_PORT,
                )
                print(f"Registered {SERVICE_NAME} to Eureka Server at {EUREKA_SERVER}")
            except Exception as e:
                print(f"Failed to register with Eureka: {e}")
