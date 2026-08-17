$files = Get-ChildItem -Path "C:\Users\Clark L. Montoya\.gemini\antigravity-ide\brain\00af84c4-41ff-4e1c-b8dc-6e5faa614bf5\.user_uploaded" -Filter "*.png"
foreach ($f in $files) {
    Write-Host "Source: $($f.FullName)"
    Copy-Item -Path $f.FullName -Destination "C:\Users\Clark L. Montoya\.gemini\antigravity-ide\scratch\lazaroph\src\main\webapp\images\logo.png" -Force
    Copy-Item -Path $f.FullName -Destination "C:\Users\Clark L. Montoya\.gemini\antigravity-ide\scratch\lazaroph\src\main\webapp\images\logo-official.png" -Force
    Copy-Item -Path $f.FullName -Destination "C:\Users\Clark L. Montoya\.gemini\antigravity-ide\scratch\lazaroph\src\main\webapp\images\favicon.png" -Force
    Copy-Item -Path $f.FullName -Destination "C:\Users\Clark L. Montoya\.gemini\antigravity-ide\scratch\lazaroph\src\main\webapp\images\brand-lazaroph.png" -Force
    Write-Host "Copied logo successfully!"
}
