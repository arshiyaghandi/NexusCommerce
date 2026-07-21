Get-Process java -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = $_
    try {
        $conns = Get-NetTCPConnection -OwningProcess $proc.Id -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            if ($c.LocalPort -ge 8760 -and $c.LocalPort -le 8800) {
                Write-Host "PID $($proc.Id) uses port $($c.LocalPort)"
            }
        }
    } catch {}
}
