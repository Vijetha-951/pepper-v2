# Simple script to update imports
Set-Location "c:\xampp\htdocs\PEPPER\frontend"

Write-Host "Updating import statements..." -ForegroundColor Green

# Get all JSX and JS files in src
$files = Get-ChildItem -Path "src" -Recurse -Include "*.jsx", "*.js"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $updated = $false
    
    # Update component imports to .jsx
    $patterns = @(
        @{old = 'from [''"](\.\./?)App[''"]'; new = 'from "$1App.jsx"'},
        @{old = 'from [''"](\.\./?)components/Navbar[''"]'; new = 'from "$1components/Navbar.jsx"'},
        @{old = 'from [''"](\.\./?)components/ProtectedRoute[''"]'; new = 'from "$1components/ProtectedRoute.jsx"'},
        @{old = 'from [''"](\.\./?)components/GoogleOAuthStatus[''"]'; new = 'from "$1components/GoogleOAuthStatus.jsx"'},
        @{old = 'from [''"](\.\./?)pages/AddProducts[''"]'; new = 'from "$1pages/AddProducts.jsx"'},
        @{old = 'from [''"](\.\./?)pages/AdminProductManagement[''"]'; new = 'from "$1pages/AdminProductManagement.jsx"'},
        @{old = 'from [''"](\.\./?)pages/AdminUserManagement[''"]'; new = 'from "$1pages/AdminUserManagement.jsx"'},
        @{old = 'from [''"](\.\./?)pages/AuthCallback[''"]'; new = 'from "$1pages/AuthCallback.jsx"'},
        @{old = 'from [''"](\.\./?)pages/CompleteProfile[''"]'; new = 'from "$1pages/CompleteProfile.jsx"'},
        @{old = 'from [''"](\.\./?)pages/Dashboard[''"]'; new = 'from "$1pages/Dashboard.jsx"'},
        @{old = 'from [''"](\.\./?)pages/DeliveryDashboard[''"]'; new = 'from "$1pages/DeliveryDashboard.jsx"'},
        @{old = 'from [''"](\.\./?)pages/Home[''"]'; new = 'from "$1pages/Home.jsx"'},
        @{old = 'from [''"](\.\./?)pages/Login[''"]'; new = 'from "$1pages/Login.jsx"'},
        @{old = 'from [''"](\.\./?)pages/Register[''"]'; new = 'from "$1pages/Register.jsx"'},
        @{old = 'from [''"](\.\./?)pages/RoleBasedDashboard[''"]'; new = 'from "$1pages/RoleBasedDashboard.jsx"'}
    )
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern.old) {
            $content = $content -replace $pattern.old, $pattern.new
            $updated = $true
        }
    }
    
    if ($updated) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "Updated: $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "Import updates completed!" -ForegroundColor Green