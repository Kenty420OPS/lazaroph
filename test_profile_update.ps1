$login = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -Body (ConvertTo-Json @{email='admin@lazaroph.com';password='admin123'}) -ContentType 'application/json'
$token = $login.data.token

# Update profile with new phone number
$updateBody = @{ name='LAZAROPH Administrator'; email='admin@lazaroph.com'; phone='09179998888'; password='' } | ConvertTo-Json
$res = Invoke-RestMethod -Uri 'http://localhost:8080/api/admin/profile' -Method Post -Headers @{Authorization="Bearer $token"} -Body $updateBody -ContentType 'application/json'

Write-Host "Updated Admin Phone:" $res.data.phone
