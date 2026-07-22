$r = Invoke-WebRequest -Uri 'http://localhost:8085/api/products' -TimeoutSec 10 -UseBasicParsing
$products = $r.Content | ConvertFrom-Json
Write-Host "Total products: $($products.Count)"
Write-Host ""
$products | ForEach-Object {
    Write-Host "$($_.skuCode) | $($_.name) | `$$($_.price)"
}
