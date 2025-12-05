# Close all Chrome instances and start with debugging enabled
Write-Host "Closing all Chrome instances..." -ForegroundColor Yellow
Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Starting Chrome with remote debugging on port 9222..." -ForegroundColor Green
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--remote-debugging-port=9222", "http://localhost:3000"

Write-Host ""
Write-Host "Chrome started! Wait for the page to load, then run:" -ForegroundColor Cyan
Write-Host "  node scripts/demo-walkthrough-v2.js --attach" -ForegroundColor White



