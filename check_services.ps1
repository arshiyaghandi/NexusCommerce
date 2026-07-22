$ports = @(8761, 8080, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089)
$names = @("discovery", "gateway", "order", "inventory", "messaging", "product", "cart", "payment", "notification", "finance")
for ($i = 0; $i -lt $ports.Count; $i++) {
    $port = $ports[$i]
    $name = $names[$i]
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$port/actuator/health" -TimeoutSec 5 -UseBasicParsing
        $body = $r.Content | ConvertFrom-Json
        Write-Host "$name ($port) : $($body.status)"
    } catch {
        Write-Host "$name ($port) : ERROR - $($_.Exception.Message)"
    }
}
