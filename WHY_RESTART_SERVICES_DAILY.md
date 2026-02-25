# 🔄 Why Do I Need to Restart Services Every Day?

## **The Short Answer:**
The Python Disease Detection API runs as a **temporary process**, not a **permanent service**. When you close your computer/terminal, it stops.

---

## **Understanding the Architecture:**

### ⚙️ **Different Service Types in PEPPER:**

| Service | Type | Auto-Start? | Persists? |
|---------|------|-------------|-----------|
| **MongoDB** | Windows Service | ✅ Yes | ✅ Yes |
| **Node.js Backend** | Manual Process | ❌ No | ❌ No |
| **React Frontend** | Dev Server | ❌ No | ❌ No |
| **Python API** | Manual Process | ❌ No | ❌ No |

### Why MongoDB is Different:
- Installed as a **Windows Service**
- Runs in background automatically
- Starts on system boot
- Managed by Windows Service Manager

### Why Python API Stops:
- Runs as a **foreground console application**
- Lives only while terminal is open
- Stops when:
  - Terminal window is closed
  - Computer restarts
  - User logs out
  - Process crashes
  - Manual Ctrl+C

---

## **What Happens Each Day:**

### ❌ **Yesterday Evening:**
```
You: Close computer/terminal
Python API: "Goodbye!" [Process terminates]
Port 5002: [Now free/unused]
```

### 🌅 **Today Morning:**
```
You: Open disease detection page
Browser: Tries to call API on port 5002
Port 5002: [Nothing listening]
Result: Error 500 - Connection refused
```

---

## **Solutions Ranked (Best to Worst):**

### 🥇 **BEST: Quick Start Script**
**Effort:** Low | **Reliability:** High | **Control:** High

**Use:** `START_ALL_SERVICES.bat`

**Pros:**
- ✅ One click to start everything
- ✅ Easy to stop when not needed
- ✅ Can see console output for debugging
- ✅ No system configuration changes
- ✅ Works immediately

**Cons:**
- ⚠️ Have to run it once per day
- ⚠️ Window must stay open

**Best for:** Daily development work

---

### 🥈 **GOOD: Task Scheduler Auto-Start**
**Effort:** Medium (one-time setup) | **Reliability:** High | **Control:** Medium

**Setup:** See `AUTO_START_SETUP_GUIDE.md`

**Pros:**
- ✅ Completely automatic
- ✅ Starts on login
- ✅ Auto-restarts on failure
- ✅ Works across reboots

**Cons:**
- ⚠️ Runs even when not needed
- ⚠️ Harder to see errors
- ⚠️ Uses system resources
- ⚠️ One-time setup required

**Best for:** Production-like environments, daily active use

---

### 🥉 **OKAY: Status Checker + Manual Start**
**Effort:** Low | **Reliability:** Medium | **Control:** High

**Use:** 
1. `CHECK_SERVICES.bat` - See what's running
2. `START_ALL_SERVICES.bat` - Start missing services

**Pros:**
- ✅ Know exactly what's running
- ✅ Start only what you need
- ✅ No configuration needed

**Cons:**
- ⚠️ Requires manual checking
- ⚠️ Two steps instead of one

**Best for:** Occasional use, debugging

---

### 📝 **Manual Start (Current Method)**
**Effort:** Medium | **Reliability:** Low | **Control:** High

**Commands:**
```bash
cd backend\python
python disease_detection_api.py
```

**Pros:**
- ✅ Full control
- ✅ See all output

**Cons:**
- ⚠️ Must remember command
- ⚠️ Must remember path
- ⚠️ Easy to forget
- ⚠️ Repetitive

**Best for:** When troubleshooting

---

## **Recommended Daily Workflow:**

### 📅 **Option A: "I Use PEPPER Daily"**
```batch
# ONE-TIME SETUP (15 minutes):
1. Follow AUTO_START_SETUP_GUIDE.md
2. Set up Task Scheduler

# DAILY:
1. Log in to Windows
2. Wait 10 seconds (services auto-start)
3. Open http://localhost:3000
4. Everything works! ✨
```

### 📅 **Option B: "I Use PEPPER Sometimes"**
```batch
# DAILY ROUTINE (30 seconds):
1. Double-click: START_ALL_SERVICES.bat
2. Wait 5 seconds
3. Open http://localhost:3000
4. Everything works! ✨

# WHEN DONE:
Close the Python API window (or keep it open)
```

### 📅 **Option C: "I'm Debugging"**
```batch
# When you need full control:
1. Run: CHECK_SERVICES.bat
2. Manually start what you need
3. Watch console output for errors
```

---

## **Quick Reference Commands:**

### Check What's Running:
```batch
CHECK_SERVICES.bat
```

### Start Everything:
```batch
START_ALL_SERVICES.bat
```

### Start Just Python API:
```batch
cd backend\python
python disease_detection_api.py
```

### Check Specific Port:
```powershell
netstat -ano | Select-String ":5002"
```

### Kill Python API:
```powershell
taskkill /F /IM python.exe
```

---

## **Why Not Convert to Windows Service?**

You could convert the Python API to a proper Windows service, but:

**Pros:**
- ✅ True background service
- ✅ Auto-start on boot
- ✅ Managed by Windows

**Cons:**
- ⚠️ Complex setup (requires NSSM or PyInstaller)
- ⚠️ Harder to update code
- ⚠️ Difficult to debug
- ⚠️ Overkill for development environment
- ⚠️ May conflict with code changes

**Verdict:** Not worth it for development. Task Scheduler is good enough.

---

## **Troubleshooting:**

### "I ran START_ALL_SERVICES.bat but still getting errors"

**Check 1:** Is the Python API window still open?
```powershell
netstat -ano | Select-String ":5002"
```

**Check 2:** Did it show any errors on startup?
Look at the Python API console window for error messages.

**Check 3:** Is the model trained?
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/health" -Method Get
# Should show: "model_trained": true
```

---

### "The Python API window closed by itself"

**Causes:**
1. Error/crash - check console for errors
2. Accidentally pressed key in console
3. System update/restart
4. Antivirus interference

**Solution:**
Restart it:
```batch
START_ALL_SERVICES.bat
```

---

### "I don't want to keep the window open"

**Options:**

**A. Use Task Scheduler** (recommended)
- Runs in background
- See AUTO_START_SETUP_GUIDE.md

**B. Run in PowerShell background:**
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\xampp\htdocs\PEPPER\backend\python'; python disease_detection_api.py" -WindowStyle Hidden
```

**C. Use `screen` or `tmux`** (if you have WSL)

---

## **Prevention Checklist:**

Before closing your computer for the day:

- [ ] Note which services you have running
- [ ] Consider keeping them running overnight (if computer stays on)
- [ ] Or set up Task Scheduler for auto-start tomorrow
- [ ] Bookmark START_ALL_SERVICES.bat for quick access

---

## **Future Improvements:**

Possible enhancements to avoid this issue:

1. ✅ **Created:** Quick start scripts
2. ✅ **Created:** Status checker
3. ✅ **Created:** Auto-start guide
4. 🔜 **Could add:** Desktop shortcut to START_ALL_SERVICES.bat
5. 🔜 **Could add:** System tray app to show service status
6. 🔜 **Could add:** Watchdog script to auto-restart crashed services
7. 🔜 **Could add:** Docker containers (most robust but complex)

---

## **Summary:**

### What You Need to Remember:

1. **Python API doesn't auto-start** - it's not a Windows service
2. **Run once per day:** `START_ALL_SERVICES.bat`
3. **Keep the window open** while working
4. **Or set up Task Scheduler** for fully automatic operation

### Files to Keep Handy:

- `START_ALL_SERVICES.bat` - Start everything
- `CHECK_SERVICES.bat` - Check status
- `AUTO_START_SETUP_GUIDE.md` - For automatic startup

---

**Bottom Line:** This is **normal behavior** for development servers. Even experienced developers manually start their services daily. The scripts I created make it as painless as possible! 🚀

---

**Created:** February 19, 2026  
**Purpose:** Explain why services need restarting and provide solutions
