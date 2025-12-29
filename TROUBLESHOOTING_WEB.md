# Web App Troubleshooting

## Blank Screen Issues

If you see a blank screen:

1. **Check Browser Console (F12 or Cmd+Option+I)**
   - Look for JavaScript errors
   - Look for Flutter initialization errors
   - Take a screenshot of any red errors

2. **Clear Service Worker Cache**
   - Open DevTools (F12)
   - Go to Application tab
   - Click "Service Workers" in the left sidebar
   - Click "Unregister" on any service workers
   - Go to "Storage" → "Clear site data"
   - Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

3. **Restart Flutter Dev Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   flutter run -d chrome -t lib/main_dev.dart
   ```

4. **Full Rebuild**
   ```bash
   flutter clean
   flutter pub get
   flutter run -d chrome -t lib/main_dev.dart
   ```

## Common Issues

### Service Worker Caching Old Code
- Solution: Clear service worker as described above

### JavaScript Errors
- Check console for specific errors
- Look for import/module errors
- Check for Firebase initialization errors

### App Stuck on Splash Screen
- Check if Firebase is initializing properly
- Check if providers are initializing
- Look for async initialization errors

