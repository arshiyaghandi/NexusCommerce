$ports = @(8082, 8084, 8085, 8087, 8088, 8089)
$names = @("order", "messaging", "product", "payment", "notification", "finance")
for ($i = 0; $i -lt $ports.Count; $i++) {
    $port = $ports[$i]
    $name = $names[$i]
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$port/actuator/health" -TimeoutSec 5 -UseBasicParsing
        Write-Host "$name ($port) : $($r.Content)"
    } catch {
        Write-Host "$name ($port) : ERROR - $($_.Exception.Message)"
    }
}
