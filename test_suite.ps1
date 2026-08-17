$tests = @()

# 1. Test Static Root HTML
$html = Invoke-WebRequest -Uri 'http://localhost:8080/' -UseBasicParsing
$tests += [PSCustomObject]@{ Test='Root HTML Status'; Status=$html.StatusCode; Expected=200; Passed=($html.StatusCode -eq 200) }

# 2. Test CSS Files
$css = Invoke-WebRequest -Uri 'http://localhost:8080/css/main.css' -UseBasicParsing
$tests += [PSCustomObject]@{ Test='main.css Status'; Status=$css.StatusCode; Expected=200; Passed=($css.StatusCode -eq 200) }

# 3. Test Products API
$prods = Invoke-RestMethod -Uri 'http://localhost:8080/api/products' -Method Get
$tests += [PSCustomObject]@{ Test='Products API Count'; Status=$prods.data.Count; Expected='>= 9'; Passed=($prods.data.Count -ge 9) }

# 4. Test US Shoe Size Variant on Product 1
$p1 = Invoke-RestMethod -Uri 'http://localhost:8080/api/products/1' -Method Get
$hasUs10 = ($p1.data.variants | Where-Object { $_.size -eq 'US 10' }).Count -gt 0
$tests += [PSCustomObject]@{ Test='US 10 Size Variant Present'; Status=$hasUs10; Expected=$true; Passed=$hasUs10 }

# 5. Test Admin Login & Stats API
$adminLogin = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -Body (ConvertTo-Json @{email='admin@lazaroph.com';password='admin123'}) -ContentType 'application/json'
$adminToken = $adminLogin.data.token
$tests += [PSCustomObject]@{ Test='Admin Auth Token Generated'; Status=($adminToken.Length -gt 10); Expected=$true; Passed=($adminToken.Length -gt 10) }

# 6. Test Admin Stats with Token
$stats = Invoke-RestMethod -Uri 'http://localhost:8080/api/admin/stats' -Method Get -Headers @{Authorization=('Bearer ' + $adminToken)}
$tests += [PSCustomObject]@{ Test='Admin Gross Revenue Metric'; Status=$stats.data.totalSales; Expected='> 0'; Passed=($stats.data.totalSales -gt 0) }

# 7. Test Admin Custom Orders Pipeline
$customs = Invoke-RestMethod -Uri 'http://localhost:8080/api/admin/custom-orders' -Method Get -Headers @{Authorization=('Bearer ' + $adminToken)}
$tests += [PSCustomObject]@{ Test='Custom Orders Pipeline Count'; Status=$customs.data.Count; Expected='>= 1'; Passed=($customs.data.Count -ge 1) }

# 8. Test Inventory Matrix API
$matrix = Invoke-RestMethod -Uri 'http://localhost:8080/api/admin/inventory' -Method Get -Headers @{Authorization=('Bearer ' + $adminToken)}
$tests += [PSCustomObject]@{ Test='Inventory Matrix Variants'; Status=$matrix.data.Count; Expected='> 30'; Passed=($matrix.data.Count -gt 30) }

# 9. Test Public Brands API (Default Nike & Adidas)
$brands = Invoke-RestMethod -Uri 'http://localhost:8080/api/brands' -Method Get
$hasNike = @($brands.data | Where-Object { $_.name -eq 'Nike' }).Count -gt 0
$hasAdidas = @($brands.data | Where-Object { $_.name -eq 'Adidas' }).Count -gt 0
$tests += [PSCustomObject]@{ Test='Public Brands API Count (Defaults)'; Status=$brands.data.Count; Expected='>= 2'; Passed=($brands.data.Count -ge 2) }
$tests += [PSCustomObject]@{ Test='Nike Brand in Active Catalog'; Status=$hasNike; Expected=$true; Passed=$hasNike }
$tests += [PSCustomObject]@{ Test='Adidas Brand in Active Catalog'; Status=$hasAdidas; Expected=$true; Passed=$hasAdidas }

# 10. Test Admin Brand Creation API (+ Add Brand)
$newBrandPayload = @{
    name = 'Puma'
    logoUrl = '/images/brand-puma.png'
    description = 'Speed, agility, and modern streetwear aesthetic.'
    status = 'ACTIVE'
} | ConvertTo-Json
$createdBrand = Invoke-RestMethod -Uri 'http://localhost:8080/api/admin/brands' -Method Post -Body $newBrandPayload -Headers @{Authorization=('Bearer ' + $adminToken)} -ContentType 'application/json'
$tests += [PSCustomObject]@{ Test='Admin + Add Brand Dynamic API'; Status=($createdBrand.data.name -eq 'Puma'); Expected=$true; Passed=($createdBrand.data.name -eq 'Puma') }

$tests | Format-Table -AutoSize
