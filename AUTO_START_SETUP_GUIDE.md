# Auto-Start Disease Detection API on Windows Login
# Using Windows Task Scheduler

## **Setup Instructions:**

### 1. Create the Batch File (Already Done!)
Location: `C:\xampp\htdocs\PEPPER\start-disease-detection.bat`

### 2. Open Task Scheduler
- Press `Win + R`
- Type: `taskschd.msc`
- Press Enter

### 3. Create New Task
1. Click **"Create Task"** (on right side)
2. **General Tab:**
   - Name: `PEPPER Disease Detection API`
   - Description: `Auto-start Python Flask API for disease detection`
   - ✅ Check: "Run whether user is logged on or not"
   - ✅ Check: "Run with highest privileges"
   - Configure for: Windows 10

3. **Triggers Tab:**
   - Click **"New"**
   - Begin the task: **"At log on"**
   - Specific user: [Your username]
   - ✅ Check: "Enabled"
   - Click **OK**

4. **Actions Tab:**
   - Click **"New"**
   - Action: **"Start a program"**
   - Program/script: `C:\Windows\System32\cmd.exe`
   - Add arguments: `/c "cd /d C:\xampp\htdocs\PEPPER\backend\python && python disease_detection_api.py"`
   - Start in: `C:\xampp\htdocs\PEPPER\backend\python`
   - Click **OK**

5. **Conditions Tab:**
   - ❌ Uncheck: "Start only if on AC power"
   - ✅ Check: "Wake computer to run this task"

6. **Settings Tab:**
   - ✅ Check: "Allow task to be run on demand"
   - ✅ Check: "Run task as soon as possible after scheduled start is missed"
   - If running task fails, restart every: **1 minute**
   - Attempt to restart up to: **3 times**

7. Click **OK** to save

### 4. Test It
Right-click the task → Click **"Run"**

Check if running:
```powershell
netstat -ano | Select-String ":5002"
```

---

## **Quick Enable/Disable:**

### Disable Auto-Start (when you don't need it):
```powershell
Disable-ScheduledTask -TaskName "PEPPER Disease Detection API"
```

### Enable Auto-Start:
```powershell
Enable-ScheduledTask -TaskName "PEPPER Disease Detection API"
```

### Check Status:
```powershell
Get-ScheduledTask -TaskName "PEPPER Disease Detection API"
```

---

## **Benefits:**
✅ API starts automatically when you log in  
✅ No manual intervention needed  
✅ Auto-restarts if it crashes  
✅ Works across reboots  

## **Drawbacks:**
⚠️ Runs in background (harder to see errors)  
⚠️ Consumes resources even when not using the feature  
⚠️ Need to manually stop/start to update code  

---

## **To Stop the Auto-Started Service:**

### Find the Process:
```powershell
Get-Process python | Where-Object {$_.Path -like "*disease*"}
```

### Kill It:
```powershell
taskkill /F /IM python.exe
```

Or disable the scheduled task:
```powershell
Disable-ScheduledTask -TaskName "PEPPER Disease Detection API"
```
