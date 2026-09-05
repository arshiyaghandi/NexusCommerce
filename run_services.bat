@echo off
echo Starting NexusCommerce Services...

cd /d C:\Users\Asus\Desktop\NexusCommerce

echo Starting Discovery Service...
start "Discovery" cmd /c "cd /d discovery-service\discovery && java -jar target\discovery-service-1.0.0-SNAPSHOT.jar"
timeout /t 15 /nobreak >nul

echo Starting API Gateway...
start "Gateway" cmd /c "cd /d api-gateway\gateway && java -jar target\api-gateway-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo Starting Product Service...
start "Product" cmd /c "cd /d product-service\product-service && java -jar target\product-service-1.0.0-SNAPSHOT.jar"

echo Starting Order Service...
start "Order" cmd /c "cd /d order-service\order-service && java -jar target\order-service-1.0.0-SNAPSHOT.jar"

echo Starting Inventory Service...
start "Inventory" cmd /c "cd /d inventory-service\inventory-service && java -jar target\inventory-service-1.0.0-SNAPSHOT.jar"

echo Starting Cart Service...
start "Cart" cmd /c "cd /d cart-service\cart-service && java -jar target\cart-service-1.0.0-SNAPSHOT.jar"

echo Starting Payment Service...
start "Payment" cmd /c "cd /d payment-service\payment-service && java -jar target\payment-service-1.0.0-SNAPSHOT.jar"

echo Starting Finance Service...
start "Finance" cmd /c "cd /d finance-service\finance-service && java -jar target\finance-service-1.0.0-SNAPSHOT.jar"

echo Starting Messaging Service...
start "Messaging" cmd /c "cd /d messaging-service\messaging-service && java -jar target\messaging-service-1.0.0-SNAPSHOT.jar"

echo Starting Notification Service...
start "Notification" cmd /c "cd /d notification-service\notification-service && java -jar target\notification-service-1.0.0-SNAPSHOT.jar"

echo Starting Auth Service...
start "Auth" cmd /c "cd /d auth-service\auth && java -jar target\auth-1.0.0-SNAPSHOT.jar"

echo Starting Recommendation Service (Python)...
start "Recommendation" cmd /c "cd /d recommendation-service && if not exist venv (python -m venv venv) && call venv\Scripts\activate.bat && pip install -r requirements.txt && python manage.py runserver 8000"

echo Starting Frontend...
start "Frontend" cmd /c "cd /d frontend && npm run dev"

echo All services launched!
