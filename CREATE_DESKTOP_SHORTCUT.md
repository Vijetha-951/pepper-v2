# Create Desktop Shortcut for Easy Access

## **Quick Setup (30 seconds):**

### 1. Create Shortcut
Right-click on `START_ALL_SERVICES.bat` → **Send to** → **Desktop (create shortcut)**

### 2. Rename It (Optional)
Right-click the shortcut → **Rename** → Type: `🚀 Start PEPPER`

### 3. Change Icon (Optional)
1. Right-click shortcut → **Properties**
2. Click **Change Icon**
3. Choose a nice icon
4. Click **OK**

### 4. Pin to Taskbar (Optional)
Drag the shortcut to your taskbar

---

## **Or Use PowerShell to Create Automatically:**

```powershell
# Run this in PowerShell (as Administrator)
$WScriptShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WScriptShell.CreateShortcut("$Desktop\🚀 Start PEPPER.lnk")
$Shortcut.TargetPath = "C:\xampp\htdocs\PEPPER\START_ALL_SERVICES.bat"
$Shortcut.WorkingDirectory = "C:\xampp\htdocs\PEPPER"
$Shortcut.Description = "Start PEPPER Disease Detection Services"
$Shortcut.Save()

Write-Host "✅ Shortcut created on Desktop!" -ForegroundColor Green
```

---

## **Daily Usage (After Setup):**

1. **Double-click** the desktop icon
2. Wait 5 seconds
3. Your services are running! ✨

That's it! No more navigating folders or remembering commands.

---

## **Alternative: Pin to Start Menu**

### Windows 10/11:
1. Press `Win` key
2. Type: "START_ALL_SERVICES"
3. Right-click the result → **Pin to Start**

Now it's in your Start Menu!

---

## **Bonus: Create Status Check Shortcut Too**

Repeat the process for `CHECK_SERVICES.bat`:

Right-click `CHECK_SERVICES.bat` → Send to → Desktop

Rename to: `📊 Check PEPPER Status`

---

**Now you have:**
- 🚀 One-click startup
- 📊 One-click status check
- 🎯 Easy access from desktop

**No more forgetting to start services!**
