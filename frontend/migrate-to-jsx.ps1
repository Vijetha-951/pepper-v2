# Migrate React Components from .js to .jsx

$frontendPath = "c:\xampp\htdocs\PEPPER\frontend"
Set-Location $frontendPath

Write-Host "🚀 Starting .js to .jsx migration for React components..." -ForegroundColor Green
Write-Host "📁 Working directory: $frontendPath" -ForegroundColor Cyan

# Define React component files to migrate
$reactFiles = @(
    "src\App.js",
    "src\index.js",
    "src\components\Navbar.js",
    "src\components\ProtectedRoute.js", 
    "src\components\GoogleOAuthStatus.js",
    "src\pages\AddProducts.js",
    "src\pages\AdminProductManagement.js",
    "src\pages\AdminUserManagement.js",
    "src\pages\AuthCallback.js",
    "src\pages\CompleteProfile.js",
    "src\pages\Dashboard.js",
    "src\pages\DeliveryDashboard.js",
    "src\pages\Home.js",
    "src\pages\Login.js",
    "src\pages\Register.js",
    "src\pages\RoleBasedDashboard.js"
)

Write-Host "`n📋 Files to migrate:" -ForegroundColor Yellow
$reactFiles | ForEach-Object { Write-Host "  • $_" -ForegroundColor Gray }

Write-Host "`n🔄 Renaming files..." -ForegroundColor Yellow
$migratedCount = 0
$skippedCount = 0

foreach ($file in $reactFiles) {
    $fullPath = Join-Path $frontendPath $file
    
    if (Test-Path $fullPath) {
        $newPath = $fullPath -replace '\.js$', '.jsx'
        
        try {
            Move-Item -Path $fullPath -Destination $newPath -Force
            Write-Host "  ✅ $file → $($file -replace '\.js$', '.jsx')" -ForegroundColor Green
            $migratedCount++
        }
        catch {
            Write-Host "  ❌ Failed to rename $file : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  ⚠️  File not found: $file" -ForegroundColor Yellow
        $skippedCount++
    }
}

Write-Host "`n📊 Migration Summary:" -ForegroundColor Cyan
Write-Host "  • Files migrated: $migratedCount" -ForegroundColor Green
Write-Host "  • Files skipped: $skippedCount" -ForegroundColor Yellow

Write-Host "`n✅ File renaming completed!" -ForegroundColor Green
Write-Host "📝 Next step: Run update-imports.ps1 to fix import statements" -ForegroundColor Cyan