# verify_chat_payment.ps1 - Automated Verification for Chat Payment Upload & Double Confirmation
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " LAZAROPH - Chat Payment Proof (+) & Double Confirmation Verification" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080"

# 1. Customer Login
Write-Host "`n[1/6] Testing Customer Login..." -ForegroundColor Yellow
$loginPayload = @{
    email = "customer@example.com"
    password = "customer123"
} | ConvertTo-Json

$custLoginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/customer/login" -Method POST -Body $loginPayload -ContentType "application/json"
$custToken = $custLoginResp.data.token
if (-not $custToken) {
    throw "Customer login failed!"
}
Write-Host " -> Customer logged in. Token: $($custToken.Substring(0, 15))..." -ForegroundColor Green

# 2. Get / Start Customer Conversation
Write-Host "`n[2/6] Starting / Fetching Customer Support Conversation..." -ForegroundColor Yellow
$convPayload = @{
    orderId = 1
    orderNumber = "LZPH-20260815-0001"
    subject = "Payment Verification"
} | ConvertTo-Json

$convResp = Invoke-RestMethod -Uri "$baseUrl/api/chat/start" -Method POST -Body $convPayload -ContentType "application/json" -Headers @{ Authorization = "Bearer $custToken" }
$convData = $convResp.data
$convId = $convData.id
Write-Host " -> Active Conversation ID: $convId (Order: $($convData.orderNumber))" -ForegroundColor Green

# 3. Customer Uploads Payment Proof (+)
Write-Host "`n[3/6] Simulating Customer uploading GCash Payment Proof (+) with Double Confirmation..." -ForegroundColor Yellow

# Generate 1x1 base64 PNG
$sampleBase64Png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

$uploadPayload = @{
    conversationId = $convId
    filename = "gcash_receipt_test.png"
    imageData = $sampleBase64Png
    message = "💳 [PROOF OF PAYMENT] GCash receipt submitted for verification. (Amount: ₱3,499.00 • Ref: GCASH-10029384)"
    messageType = "PAYMENT_PROOF"
    referenceNumber = "GCASH-10029384"
} | ConvertTo-Json

$uploadResp = Invoke-RestMethod -Uri "$baseUrl/api/chat/upload-image" -Method POST -Body $uploadPayload -ContentType "application/json" -Headers @{ Authorization = "Bearer $custToken" }
$uploadData = $uploadResp.data

if (-not $uploadData.imageUrl -or $uploadData.messageType -ne "PAYMENT_PROOF") {
    throw "Payment proof upload failed: Response does not contain imageUrl or correct messageType! Output: $($uploadResp | ConvertTo-Json)"
}
Write-Host " -> Payment Proof Saved: $($uploadData.imageUrl)" -ForegroundColor Green
Write-Host " -> Message Type: $($uploadData.messageType)" -ForegroundColor Green
Write-Host " -> Caption: $($uploadData.message)" -ForegroundColor Green

# 4. Check Messages in Conversation
Write-Host "`n[4/6] Verifying Payment Proof appears in Conversation Feed..." -ForegroundColor Yellow
$feedResp = Invoke-RestMethod -Uri "$baseUrl/api/chat/conversations/$convId/messages" -Method GET -Headers @{ Authorization = "Bearer $custToken" }
$messages = $feedResp.data.messages
$proofMsg = $messages | Where-Object { $_.messageType -eq "PAYMENT_PROOF" }
if (-not $proofMsg) {
    throw "Payment proof message not found in feed!"
}
Write-Host " -> Verified in messages feed: ID $($proofMsg.id), Attachment: $($proofMsg.imageUrl)" -ForegroundColor Green

# 5. Admin Two-Step Authentication
Write-Host "`n[5/6] Testing Administrator Two-Step Authentication..." -ForegroundColor Yellow
$step1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/admin/login-step1" -Method POST -Body (@{ email = "admin1@lazaroph.com"; password = "AdminPassword123!" } | ConvertTo-Json) -ContentType "application/json"
$step2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/admin/verify-step2" -Method POST -Body (@{ preAuthToken = $step1.data.preAuthToken; securityPassword = "992104" } | ConvertTo-Json) -ContentType "application/json"
$adminToken = $step2.data.adminToken

if (-not $adminToken) {
    throw "Admin 2-step login failed!"
}
Write-Host " -> Admin authenticated! Token: $($adminToken.Substring(0, 15))..." -ForegroundColor Green

# 6. Admin Executes Payment Double Confirmation Verification
Write-Host "`n[6/6] Testing Admin Double Confirmation Payment Verification..." -ForegroundColor Yellow
$verifyResp = Invoke-RestMethod -Uri "$baseUrl/api/chat/conversations/$convId/verify-payment" -Method POST -Headers @{ Authorization = "Bearer $adminToken" }
$verifyData = $verifyResp.data

if ($verifyData.messageType -ne "PAYMENT_VERIFIED") {
    throw "Payment verification failed! Expected PAYMENT_VERIFIED, got: $($verifyData.messageType)"
}
Write-Host " -> Payment successfully verified! Verification Announcement: $($verifyData.message)" -ForegroundColor Green

# Check order status in admin orders
$ordersResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/orders" -Method GET -Headers @{ Authorization = "Bearer $adminToken" }
$ordersList = if ($ordersResp.data) { $ordersResp.data } else { $ordersResp }
$targetOrder = $ordersList | Where-Object { $_.id -eq 1 }
Write-Host " -> Target Order #1 status: $($targetOrder.status)" -ForegroundColor Green
if ($targetOrder.status -ne "PAID") {
    throw "Order status was not updated to PAID! Status: $($targetOrder.status)"
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " ALL CHAT PAYMENT UPLOAD & DOUBLE CONFIRMATION TESTS PASSED!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
