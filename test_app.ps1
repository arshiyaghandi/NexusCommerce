Start-Sleep -Seconds 2
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 10 -UseBasicParsing
    Write-Host "Frontend Status: $($r.StatusCode)"
    Write-Host "Content Length: $($r.Content.Length) bytes"
    Write-Host "Title found: $($r.Content -match '<title>(.*?)</title>')"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8085/api/products' -TimeoutSec 10 -UseBasicParsing
    $products = $r.Content | ConvertFrom-Json
    Write-Host "`nProduct API: $($products.Count) products found"
    foreach ($p in $products) {
        Write-Host "  - $($p.name) ($($p.skuCode)): $ $($p.price)"
    }
} catch {
    Write-Host "Product API ERROR: $($_.Exception.Message)"
}

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8085/actuator/health' -TimeoutSec 5 -UseBasicParsing
    $health = $r.Content | ConvertFrom-Json
    Write-Host "`nProduct Service: $($health.status)"
} catch {
    Write-Host "Product Service: ERROR"
}
