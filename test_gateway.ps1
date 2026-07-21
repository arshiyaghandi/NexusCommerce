try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8080/api/products' -TimeoutSec 10 -UseBasicParsing
    Write-Host "Gateway /api/products: $($r.StatusCode)"
    $products = $r.Content | ConvertFrom-Json
    Write-Host "Products via gateway: $($products.Count)"
} catch {
    Write-Host "Gateway /api/products: ERROR - $($_.Exception.Message)"
}

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -TimeoutSec 5 -UseBasicParsing
    $health = $r.Content | ConvertFrom-Json
    Write-Host "Gateway health: $($health.status)"
} catch {
    Write-Host "Gateway health: ERROR - $($_.Exception.Message)"
}
