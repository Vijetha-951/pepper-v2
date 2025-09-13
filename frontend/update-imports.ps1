# Update import statements to reference .jsx files

$frontendPath = "c:\xampp\htdocs\PEPPER\frontend"
Set-Location $frontendPath

Write-Host "🔧 Updating import statements for .jsx files..." -ForegroundColor Green
Write-Host "📁 Working directory: $frontendPath" -ForegroundColor Cyan

# Get all .jsx and remaining .js files in src directory
$sourceFiles = Get-ChildItem -Path "src" -Recurse -Include "*.jsx", "*.js" | Where-Object { $_.Name -notmatch "(reportWebVitals|setupTests)" }

Write-Host "`n📋 Files to process:" -ForegroundColor Yellow
$sourceFiles | ForEach-Object { Write-Host "  • $($_.FullName -replace [regex]::Escape($frontendPath), '')" -ForegroundColor Gray }

$updateCount = 0

foreach ($file in $sourceFiles) {
    Write-Host "`n🔍 Processing: $($file.Name)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Update imports for React components (now .jsx files)
    $componentImports = @(
        @{ old = 'from [''"]\.\/App[''"]'; new = 'from "./App.jsx"' },
        @{ old = 'from [''"]\.\/components\/Navbar[''"]'; new = 'from "./components/Navbar.jsx"' },
        @{ old = 'from [''"]\.\/components\/ProtectedRoute[''"]'; new = 'from "./components/ProtectedRoute.jsx"' },
        @{ old = 'from [''"]\.\/components\/GoogleOAuthStatus[''"]'; new = 'from "./components/GoogleOAuthStatus.jsx"' },
        @{ old = 'from [''"]\.\/pages\/AddProducts[''"]'; new = 'from "./pages/AddProducts.jsx"' },
        @{ old = 'from [''"]\.\/pages\/AdminProductManagement[''"]'; new = 'from "./pages/AdminProductManagement.jsx"' },
        @{ old = 'from [''"]\.\/pages\/AdminUserManagement[''"]'; new = 'from "./pages/AdminUserManagement.jsx"' },
        @{ old = 'from [''"]\.\/pages\/AuthCallback[''"]'; new = 'from "./pages/AuthCallback.jsx"' },
        @{ old = 'from [''"]\.\/pages\/CompleteProfile[''"]'; new = 'from "./pages/CompleteProfile.jsx"' },
        @{ old = 'from [''"]\.\/pages\/Dashboard[''"]'; new = 'from "./pages/Dashboard.jsx"' },
        @{ old = 'from [''"]\.\/pages\/DeliveryDashboard[''"]'; new = 'from "./pages/DeliveryDashboard.jsx"' },
        @{ old = 'from [''"]\.\/pages\/Home[''"]'; new = 'from "./pages/Home.jsx"' },
        @{ old = 'from [''"]\.\/pages\/Login[''"]'; new = 'from "./pages/Login.jsx"' },
        @{ old = 'from [''"]\.\/pages\/Register[''"]'; new = 'from "./pages/Register.jsx"' },
        @{ old = 'from [''"]\.\/pages\/RoleBasedDashboard[''"]'; new = 'from "./pages/RoleBasedDashboard.jsx"' }
    )
    
    # Update relative path imports
    $relativePaths = @(
        @{ old = 'from [''"]\.\.\/App[''"]'; new = 'from "../App.jsx"' },
        @{ old = 'from [''"]\.\.\/components\/Navbar[''"]'; new = 'from "../components/Navbar.jsx"' },
        @{ old = 'from [''"]\.\.\/components\/ProtectedRoute[''"]'; new = 'from "../components/ProtectedRoute.jsx"' },
        @{ old = 'from [''"]\.\.\/components\/GoogleOAuthStatus[''"]'; new = 'from "../components/GoogleOAuthStatus.jsx"' }
    )
    
    $fileUpdated = $false
    
    # Apply component import updates
    foreach ($import in $componentImports) {
        if ($content -match $import.old) {
            $content = $content -replace $import.old, $import.new
            Write-Host "    ✅ Updated: $($import.old) → $($import.new)" -ForegroundColor Green
            $fileUpdated = $true
        }
    }
    
    # Apply relative path updates
    foreach ($import in $relativePaths) {
        if ($content -match $import.old) {
            $content = $content -replace $import.old, $import.new
            Write-Host "    ✅ Updated: $($import.old) → $($import.new)" -ForegroundColor Green
            $fileUpdated = $true
        }
    }
    
    if ($fileUpdated) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "  💾 File updated and saved" -ForegroundColor Green
        $updateCount++
    } else {
        Write-Host "  ℹ️  No imports to update in this file" -ForegroundColor Gray
    }
}

Write-Host "`n📊 Update Summary:" -ForegroundColor Cyan
Write-Host "  • Files processed: $($sourceFiles.Count)" -ForegroundColor Gray
Write-Host "  • Files updated: $updateCount" -ForegroundColor Green

Write-Host "`n✅ Import statement updates completed!" -ForegroundColor Green
Write-Host "📝 Next step: Test your application with 'npm start'" -ForegroundColor Cyan