# Starts the whole app for local development:
#   8000 - Laravel API, 8001 - Laravel speech audio (separate, because `php artisan serve`
#   handles one request at a time on Windows), 5173 - React (open this one in the browser).
$root = $PSScriptRoot
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root\backend'; php artisan serve --port=8000"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root\backend'; php artisan serve --port=8001"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root\frontend'; npm run dev"
Start-Sleep -Seconds 4
Start-Process 'http://localhost:5173'
