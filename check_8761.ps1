$conn = Get-NetTCPConnection -State Listen -LocalPort 8761 -ErrorAction SilentlyContinue
if ($conn) {
    $proc = Get-Process -Id $conn.OwningProcess
    Write-Host "Port 8761 used by PID: $($proc.Id) Name: $($proc.ProcessName) StartTime: $($proc.StartTime)"
} else {
    Write-Host "Port 8761 is NOT in use"
}
