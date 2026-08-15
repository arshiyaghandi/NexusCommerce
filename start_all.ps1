Write-Host "Starting NexusCommerce Services..."

# Start Discovery Service
Write-Host "Starting Discovery Service..."
Start-Process cmd -ArgumentList "/k title Discovery & cd /d C:\Users\Asus\Desktop\NexusCommerce\discovery-service\discovery & java -jar target\discovery-service-1.0.0-SNAPSHOT.jar"
Start-Sleep -Seconds 15

# Start Gateway
Write-Host "Starting API Gateway..."
Start-Process cmd -ArgumentList "/k title Gateway & cd /d C:\Users\Asus\Desktop\NexusCommerce\api-gateway\gateway & java -jar target\api-gateway-1.0.0-SNAPSHOT.jar"
Start-Sleep -Seconds 5

# Start other Spring Boot services
$services = @(
    "product-service\product-service", 
    "order-service\order-service", 
    "inventory-service\inventory-service", 
    "cart-service\cart-service", 
    "payment-service\payment-service", 
    "finance-service\finance-service", 
    "messaging-service\messaging-service", 
    "notification-service\notification-service", 
    "auth-service\auth"
)

foreach ($svc in $services) {
    $name = $svc.Split("\")[0]
    Write-Host "Starting $name..."
    $jarFile = (Get-ChildItem -Path "C:\Users\Asus\Desktop\NexusCommerce\$svc\target\*.jar" | Where-Object Name -notmatch "original").FullName
    Start-Process cmd -ArgumentList "/k title $name & java -jar `"$jarFile`""
}

# Start Recommendation Service (Python)
Write-Host "Starting Recommendation Service..."
Start-Process cmd -ArgumentList "/k title Recommendation & cd /d C:\Users\Asus\Desktop\NexusCommerce\recommendation-service & if not exist venv (python -m venv venv) & call venv\Scripts\activate.bat & pip install -r requirements.txt & python manage.py runserver 8000"

# Start Frontend
Write-Host "Starting Frontend..."
Start-Process cmd -ArgumentList "/k title Frontend & cd /d C:\Users\Asus\Desktop\NexusCommerce\frontend & npm run dev"

Write-Host "All services started successfully in separate windows! You can test the application now."
