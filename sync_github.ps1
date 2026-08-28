$src = "C:\Users\Clark L. Montoya\.gemini\antigravity-ide\scratch\lazaroph"
$dst = "C:\Users\Clark L. Montoya\OneDrive\Documents\GitHub\lazaroph"

if (Test-Path $dst) {
    Write-Host "GitHub repository target found at: $dst" -ForegroundColor Cyan

    $filesToSync = @(
        "src\main\java\com\lazaroph\model\AdminUser.java",
        "src\main\java\com\lazaroph\model\CustomerUser.java",
        "src\main\java\com\lazaroph\model\ChatMessage.java",
        "src\main\java\com\lazaroph\model\FeaturedCategory.java",
        "src\main\java\com\lazaroph\util\PasswordHasher.java",
        "src\main\java\com\lazaroph\util\JsonUtil.java",
        "src\main\java\com\lazaroph\repository\DataStore.java",
        "src\main\java\com\lazaroph\service\AuthService.java",
        "src\main\java\com\lazaroph\controller\ApiController.java",
        "database\lazaroph.sql",
        "src\main\webapp\css\auth.css",
        "src\main\webapp\css\admin.css",
        "src\main\webapp\css\chat.css",
        "src\main\webapp\css\main.css",
        "src\main\webapp\css\responsive.css",
        "src\main\webapp\index.html",
        "src\main\webapp\js\firebase-config.js",
        "src\main\webapp\js\api.js",
        "src\main\webapp\js\auth.js",
        "src\main\webapp\js\app.js",
        "src\main\webapp\js\admin.js",
        "src\main\webapp\js\chat.js",
        "src\main\webapp\css\store.css",
        "src\main\webapp\images\salmon-logo.png",
        "src\main\webapp\js\store.js",
        "src\main\webapp\js\product-detail.js",
        "src\main\webapp\js\checkout.js",
        "src\main\java\com\lazaroph\service\CourierService.java",
        "src\main\java\com\lazaroph\Main.java",
        "api\products.js",
        "api\orders.js",
        "api\sales.js",
        "api\couriers.js",
        "api\chat.js",
        "api\auth.js",
        ".gitignore",
        "build.js",
        "vercel.json",
        "verify_all.ps1",
        "verify_chat_payment.ps1"
    )

    foreach ($f in $filesToSync) {
        $sourceFile = Join-Path $src $f
        $targetFile = Join-Path $dst $f
        $targetDir = Split-Path $targetFile -Parent

        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }

        if (Test-Path $sourceFile) {
            Copy-Item -Path $sourceFile -Destination $targetFile -Force
            Write-Host " -> Copied: $f" -ForegroundColor Green
        } else {
            Write-Host " -> Source missing: $f" -ForegroundColor Red
        }
    }

    Write-Host "`nAll modified files successfully synchronized to GitHub repository!" -ForegroundColor Green
    
    Write-Host "`nRunning node build.js in target repository..." -ForegroundColor Cyan
    Push-Location $dst
    node build.js
    Pop-Location
} else {
    Write-Host "Destination path not found: $dst" -ForegroundColor Yellow
}
