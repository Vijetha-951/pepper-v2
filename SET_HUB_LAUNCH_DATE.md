# Quick Start: Setting Your Hub Launch Date

## What You Need to Do

Open this file: **`frontend/src/config/constants.js`**

Change this line to match when you actually launched your hub system:

```javascript
export const HUB_LAUNCH_DATE = new Date('2025-12-15'); // ← Change this date
```

## Examples

### If you launched hubs on January 1, 2026:
```javascript
export const HUB_LAUNCH_DATE = new Date('2026-01-01');
```

### If you launched hubs on December 1, 2025:
```javascript
export const HUB_LAUNCH_DATE = new Date('2025-12-01');
```

### If you're launching hubs today:
```javascript
export const HUB_LAUNCH_DATE = new Date(); // Uses today's date
```

## What Happens

- **Orders BEFORE this date** → Show old tracking system (Pending → Confirmed → Out for Delivery → Delivered)
- **Orders ON OR AFTER this date** → Show new hub tracking system (Hub → Hub → Hub...)

## That's It!

After changing the date, restart your frontend:
```bash
cd frontend
npm start
```

Your order tracking will automatically show the right system based on when each order was placed.
