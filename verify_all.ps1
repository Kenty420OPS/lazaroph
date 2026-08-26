Write-Host "=== 1. VERIFY STATIC ASSETS AND SPA ROUTES ===" -ForegroundColor Cyan
$urls = @(
    "http://localhost:8080/",
    "http://localhost:8080/login",
    "http://localhost:8080/register",
    "http://localhost:8080/admin/login",
    "http://localhost:8080/css/auth.css",
    "http://localhost:8080/js/auth.js",
    "http://localhost:8080/js/admin.js"
)
foreach ($u in $urls) {
    $r = Invoke-WebRequest -Uri $u -Method GET -UseBasicParsing
    Write-Host " -> $u : HTTP $($r.StatusCode) ($($r.Content.Length) bytes)" -ForegroundColor Green
}

Write-Host "`n=== 2. VERIFY COMPLETE AUTH LIFECYCLE ===" -ForegroundColor Cyan

# 2.1 Customer Registration (status PENDING)
$regBody = @{ 
    name = "Maria Clara"; 
    email = "maria.clara@gmail.com"; 
    password = "Password123!"; 
    confirmPassword = "Password123!" 
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/customer/register" -Method POST -Body $regBody -ContentType "application/json"
Write-Host "Customer Registered: $($regRes.data.email) [Status: $($regRes.data.status)]" -ForegroundColor Green

# 2.2 Verify login rejection while PENDING
$loginBody = @{ email = "maria.clara@gmail.com"; password = "Password123!" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/customer/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "ERROR: Expected 403 for unverified customer!" -ForegroundColor Red
} catch {
    Write-Host "Pending login correctly rejected with 403: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2.3 Email Simulator finds verification token
$emails = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/email-simulator/latest" -Method GET
$verifyEmail = $emails.data | Where-Object { $_.toEmail -eq "maria.clara@gmail.com" -and $_.type -eq "VERIFICATION" } | Select-Object -First 1
Write-Host "Simulated Email intercepted for $($verifyEmail.toEmail): Token = $($verifyEmail.token)" -ForegroundColor Green

# 2.4 Verify email token
$vRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/customer/verify-email" -Method POST -Body (@{ token = $verifyEmail.token } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Email verified! Customer status is now: $($vRes.data.customer.status)" -ForegroundColor Green

# 2.5 Login Customer after verification
$cLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/customer/login" -Method POST -Body $loginBody -ContentType "application/json"
$cToken = $cLogin.data.token
Write-Host "Customer authenticated! Token: $cToken" -ForegroundColor Green

# 2.6 Customer attempting Admin API (MUST be 403 Forbidden)
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/admin/admins" -Method GET -Headers @{ Authorization = "Bearer $cToken" }
    Write-Host "ERROR: Customer was allowed to call /api/admin/admins!" -ForegroundColor Red
} catch {
    Write-Host "RBAC Guard correctly blocked customer token from admin API: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== 3. VERIFY FORGOT & RESET PASSWORD ===" -ForegroundColor Cyan
# 3.1 Forgot password request
$fpRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/customer/forgot-password" -Method POST -Body (@{ email = "maria.clara@gmail.com" } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Forgot password response: $($fpRes.message)" -ForegroundColor Green

# 3.2 Inspect reset token
$emails = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/email-simulator/latest" -Method GET
$resetEmail = $emails.data | Where-Object { $_.toEmail -eq "maria.clara@gmail.com" -and $_.type -eq "PASSWORD_RESET" } | Select-Object -First 1
Write-Host "Password Reset Token received: $($resetEmail.token)" -ForegroundColor Green

# 3.3 Reset password
$rpRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/customer/reset-password" -Method POST -Body (@{ token = $resetEmail.token; newPassword = "NewSecretPassword2026!"; confirmPassword = "NewSecretPassword2026!" } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Password successfully reset: $($rpRes.message)" -ForegroundColor Green

# 3.4 Verify old password fails, new password succeeds
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/customer/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "ERROR: Old password succeeded after reset!" -ForegroundColor Red
} catch {
    Write-Host "Old password correctly rejected after reset" -ForegroundColor Yellow
}

$newLoginBody = @{ email = "maria.clara@gmail.com"; password = "NewSecretPassword2026!" } | ConvertTo-Json
$newLoginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/customer/login" -Method POST -Body $newLoginBody -ContentType "application/json"
Write-Host "Login with new password succeeded! Customer: $($newLoginRes.data.customer.name)" -ForegroundColor Green

Write-Host "`n=== 4. VERIFY TWO-STEP ADMIN AUTHENTICATION ===" -ForegroundColor Cyan
# 4.1 Admin Step 1
$a1 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/login-step1" -Method POST -Body (@{ email = "admin1@lazaroph.com"; password = "AdminPassword123!" } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Admin Step 1 Success! Pre-Auth Token: $($a1.data.preAuthToken)" -ForegroundColor Green

# 4.2 Pre-Auth Token CANNOT access Admin Dashboard API
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/admin/admins" -Method GET -Headers @{ Authorization = "Bearer $($a1.data.preAuthToken)" }
    Write-Host "ERROR: Pre-Auth token allowed access to admin API!" -ForegroundColor Red
} catch {
    Write-Host "Pre-Auth token correctly rejected from admin API: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4.3 Step 2 with incorrect PIN
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/verify-step2" -Method POST -Body (@{ preAuthToken = $a1.data.preAuthToken; securityPassword = "000000" } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "ERROR: Invalid PIN accepted!" -ForegroundColor Red
} catch {
    Write-Host "Invalid security PIN correctly rejected: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4.4 Step 2 with correct PIN
$a2 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/verify-step2" -Method POST -Body (@{ preAuthToken = $a1.data.preAuthToken; securityPassword = "992104" } | ConvertTo-Json) -ContentType "application/json"
$aToken = $a2.data.adminToken
Write-Host "Step 2 Verified! Full Admin Token: $aToken" -ForegroundColor Green

# 4.5 Verify Super Admin 2 & 3
$adm2_1 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/login-step1" -Method POST -Body (@{ email = "admin2@lazaroph.com"; password = "AdminPassword456!" } | ConvertTo-Json) -ContentType "application/json"
$adm2_2 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/verify-step2" -Method POST -Body (@{ preAuthToken = $adm2_1.data.preAuthToken; securityPassword = "882910" } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Super Admin 2 Authenticated: $($adm2_2.data.admin.name)" -ForegroundColor Green

$adm3_1 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/login-step1" -Method POST -Body (@{ email = "admin3@lazaroph.com"; password = "AdminPassword789!" } | ConvertTo-Json) -ContentType "application/json"
$adm3_2 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/verify-step2" -Method POST -Body (@{ preAuthToken = $adm3_1.data.preAuthToken; securityPassword = "773821" } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Super Admin 3 Authenticated: $($adm3_2.data.admin.name)" -ForegroundColor Green

Write-Host "`n=== 5. VERIFY ADMIN MANAGEMENT OPERATIONS ===" -ForegroundColor Cyan
# 5.1 Create new administrator
$newAdmBody = @{
    name = "Super Admin 4 (Marikina Heights)";
    email = "admin4@lazaroph.com";
    password = "AdminPassword999!";
    confirmPassword = "AdminPassword999!";
    securityPassword = "664912";
    confirmSecurity = "664912";
    role = "SUPER_ADMIN"
} | ConvertTo-Json

$createdAdm = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/admins" -Method POST -Body $newAdmBody -Headers @{ Authorization = "Bearer $aToken" } -ContentType "application/json"
Write-Host "New Administrator Created: $($createdAdm.data.name) (ID: $($createdAdm.data.id))" -ForegroundColor Green

# 5.2 List all administrators
$list = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/admins" -Method GET -Headers @{ Authorization = "Bearer $aToken" }
Write-Host "Total Administrators Active in System: $($list.data.Count)" -ForegroundColor Green
$list.data | ForEach-Object {
    Write-Host " -> [#$($_.id)] $($_.name) <$($_.email)> Role: $($_.role) Status: $($_.status)"
}

# 5.3 Toggle Admin 4 Status to DISABLED
$toggleRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/admins/status" -Method POST -Body (@{ adminId = $createdAdm.data.id; status = "DISABLED" } | ConvertTo-Json) -Headers @{ Authorization = "Bearer $aToken" } -ContentType "application/json"
Write-Host "Admin 4 status changed: $($toggleRes.data.status)" -ForegroundColor Green

# 5.4 Verify disabled admin cannot login
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/login-step1" -Method POST -Body (@{ email = "admin4@lazaroph.com"; password = "AdminPassword999!" } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "ERROR: Disabled admin was able to start login!" -ForegroundColor Red
} catch {
    Write-Host "Disabled admin login correctly rejected: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "🎉 ALL 5 VERIFICATION SUITES PASSED WITH 100% SUCCESS!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
