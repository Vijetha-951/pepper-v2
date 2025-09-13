# Create Complete Backup Before .js to .jsx Migration

$rootPath = "c:\xampp\htdocs\PEPPER"
Set-Location $rootPath

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "PEPPER_BACKUP_BEFORE_JSX_MIGRATION_$timestamp"
$backupPath = "c:\xampp\htdocs\$backupName"

Write-Host "💾 Creating complete project backup..." -ForegroundColor Green
Write-Host "Source: $rootPath" -ForegroundColor Cyan
Write-Host "Backup: $backupPath" -ForegroundColor Cyan

# Create backup directory
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Copy entire project (excluding node_modules and .git for speed)
Write-Host "`n📁 Copying project files..." -ForegroundColor Yellow

# Copy frontend
Write-Host "Copying frontend..." -ForegroundColor Gray
robocopy "$rootPath\frontend" "$backupPath\frontend" /E /XD node_modules .git build /XF *.log | Out-Null

# Copy backend  
Write-Host "Copying backend..." -ForegroundColor Gray
robocopy "$rootPath\backend" "$backupPath\backend" /E /XD node_modules .git /XF *.log | Out-Null

# Copy root files
Write-Host "Copying root files..." -ForegroundColor Gray
Copy-Item "$rootPath\*.md" "$backupPath" -Force -ErrorAction SilentlyContinue
Copy-Item "$rootPath\*.json" "$backupPath" -Force -ErrorAction SilentlyContinue
Copy-Item "$rootPath\*.js" "$backupPath" -Force -ErrorAction SilentlyContinue
Copy-Item "$rootPath\*.ps1" "$backupPath" -Force -ErrorAction SilentlyContinue
Copy-Item "$rootPath\.gitignore" "$backupPath" -Force -ErrorAction SilentlyContinue

# Create backup info file
$backupInfo = "PEPPER PROJECT BACKUP`r`n===================`r`nCreated: $(Get-Date)`r`nPurpose: Before .js to .jsx migration`r`nSource: $rootPath`r`nBackup: $backupPath`r`n`r`nCONTENTS:`r`n- Complete frontend directory (excluding node_modules)`r`n- Complete backend directory (excluding node_modules)`r`n- Root configuration files`r`n- All documentation files`r`n`r`nRESTORATION:`r`nTo restore, copy contents back to original location."

Set-Content -Path "$backupPath\BACKUP_INFO.txt" -Value $backupInfo

Write-Host "`n✅ Backup completed successfully!" -ForegroundColor Green
Write-Host "📍 Location: $backupPath" -ForegroundColor Cyan
Write-Host "`n🛡️  Your project is now safely backed up!" -ForegroundColor Green
Write-Host "`n✨ Ready for migration! You can now proceed with confidence." -ForegroundColor Green