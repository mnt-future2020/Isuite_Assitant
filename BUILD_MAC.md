# Building Mac Installer

There are 2 ways to build the Mac installer:

## Option 1: GitHub Actions (Recommended - FREE)

1. **Push code to GitHub**:
   ```bash
   cd e:/IS/desktop
   git init
   git add .
   git commit -m "Initial desktop app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/isuite-desktop.git
   git push -u origin main
   ```

2. **Trigger the build**:
   - Go to your GitHub repo
   - Click "Actions" tab
   - Click "Build Mac App" workflow
   - Click "Run workflow" button
   - Wait ~10 minutes for build to complete

3. **Download the DMG**:
   - After build completes, click on the workflow run
   - Scroll down to "Artifacts"
   - Download "iSuite-Assistant-Mac"
   - Unzip to get the `.dmg` file

## Option 2: Build on Mac Computer

If you have access to a Mac:

1. **Copy the desktop folder to Mac**:
   - Use USB drive, AirDrop, or cloud storage
   - Copy entire `e:/IS/desktop/` folder

2. **Install Xcode Command Line Tools** (first time only):
   ```bash
   xcode-select --install
   ```

3. **Build the app**:
   ```bash
   cd ~/Desktop/desktop  # or wherever you copied it
   npm install
   cd server && npm install && cd ..
   cd frontend && npm install && cd ..
   npm run build:frontend
   npm run build:mac
   ```

4. **Find the installer**:
   - Located at: `dist/iSuite Assistant-1.0.0.dmg`

## Installing on Mac

1. Double-click the `.dmg` file
2. Drag "iSuite Assistant" to Applications folder
3. **First launch**: Right-click app → "Open" (to bypass unsigned warning)
4. Enter license key: `3JPL-965Z-O3AF-3UYJ`

## Notes

- The app is **unsigned** (no Apple Developer certificate)
- Users will see "App from unidentified developer" warning
- This is normal for testing - use "Open" from right-click menu
- For production, you need Apple Developer account ($99/year) to sign the app
