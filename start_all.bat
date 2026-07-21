@echo off
cd /d C:\Users\Asus\Desktop\NexusCommerce
echo Starting all services...

start "discovery" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\discovery-service\discovery && java -jar target\discovery-service-1.0.0-SNAPSHOT.jar"
timeout /t 20 /nobreak >nul

start "gateway" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\api-gateway\gateway && java -jar target\api-gateway-1.0.0-SNAPSHOT.jar"
start "product" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\product-service\product-service && java -jar target\product-service-1.0.0-SNAPSHOT.jar"
start "order" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\order-service\order-service && java -jar target\order-service-1.0.0-SNAPSHOT.jar"
start "inventory" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\inventory-service\inventory-service && java -jar target\inventory-service-1.0.0-SNAPSHOT.jar"
start "cart" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\cart-service\cart-service && java -jar target\cart-service-1.0.0-SNAPSHOT.jar"
start "payment" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\payment-service\payment-service && java -jar target\payment-service-1.0.0-SNAPSHOT.jar"
start "finance" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\finance-service\finance-service && java -jar target\finance-service-1.0.0-SNAPSHOT.jar"
start "messaging" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\messaging-service\messaging-service && java -jar target\messaging-service-1.0.0-SNAPSHOT.jar"
start "notification" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\notification-service\notification-service && java -jar target\notification-service-1.0.0-SNAPSHOT.jar"
start "auth" cmd /c "cd /d C:\Users\Asus\Desktop\NexusCommerce\auth-service\auth && java -jar target\auth-1.0.0-SNAPSHOT.jar"

echo All services started. Waiting 30s for boot...
timeout /t 30 /nobreak >nul
echo Done.
