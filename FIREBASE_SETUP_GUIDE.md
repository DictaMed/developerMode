# Firebase Authentication Setup Guide for DictaMed

## Overview

This guide will help you set up Firebase Authentication for your DictaMed application. The integration provides secure email/password authentication, Google Sign-In, user role management, and account migration capabilities.

## Prerequisites

- A Firebase project (created at https://console.firebase.google.com)
- Basic knowledge of Firebase Console
- Access to your DictaMed project files

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `DictaMed` (or your preferred name)
4. Accept terms and click "Continue"
5. Choose whether to enable Google Analytics (optional)
6. Click "Create project"

### 1.2 Enable Authentication

1. In Firebase Console, go to **Authentication** in the left sidebar
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable the following providers:

#### Email/Password
1. Click on "Email/Password"
2. Toggle to "Enable"
3. Click "Save"

#### Google Sign-In
1. Click on "Google"
2. Toggle to "Enable"
3. Fill in the following:
   - **Project public-facing name**: DictaMed
   - **Support email**: Your support email address
   - **Project API key**: Your Firebase API key (found in Project Settings)
4. Click "Save"

### 1.3 Configure Authorized Domains

1. Go to **Settings** → **Authentication**
2. Click **Authorized domains** tab
3. Add your domain(s):
   - `localhost` (for development)
   - `your-domain.com` (for production)
   - `www.your-domain.com` (if using www subdomain)

## Step 2: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname: `DictaMed Web App`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the Firebase configuration object

The config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

## Step 3: Update Configuration Files

### 3.1 Update Firebase Config

Open `firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3.2 Configure User Roles

In `firebase-auth-service.js`, update the `determineUserRole` method to match your existing access code system:

```javascript
async determineUserRole(accessCode) {
    // Adapt this to your existing role system
    const adminAccessCodes = [
        'ADMIN123',      // Replace with your admin codes
        'MEDADMIN',      // Replace with your admin codes
        'SUPERUSER',     // Replace with your admin codes
        // Add your specific admin codes here
    ];
    return adminAccessCodes.includes(accessCode) ? 'admin' : 'user';
}
```

## Step 4: Firestore Setup (Optional but Recommended)

Firebase Authentication can work without Firestore, but for full functionality:

1. Go to **Firestore Database** in Firebase Console
2. Click "Create database"
3. Choose "Start in test mode" (you can secure it later)
4. Select a location close to your users
5. Click "Done"

The application will automatically create user profiles in Firestore.

## Step 5: Test the Integration

### 5.1 Local Testing

1. Start a local server in your project directory:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have live-server installed)
   npx live-server
   ```

2. Open `http://localhost:8000` in your browser

3. Test authentication:
   - Click "Créer un compte" to register a new user
   - Try "Se connecter" with the new account
   - Test Google Sign-In (requires proper domain setup)

### 5.2 Production Testing

1. Deploy your files to your web server
2. Update authorized domains in Firebase Console
3. Test all authentication flows in production

## Step 6: User Migration (For Existing Users)

### 6.1 Prepare Migration Data

Create a list of existing users with:
- Current username
- Current access code
- Email addresses for migration

### 6.2 Migration Process

1. Users can migrate their accounts using the "Migrer votre compte" link
2. They enter their old credentials and new email/password
3. The system automatically creates a new Firebase account with the same role

### 6.3 Bulk Migration (Optional)

For large user bases, you might want to implement bulk migration. This requires:
1. Exporting existing user data
2. Creating Firebase accounts programmatically
3. Mapping old access codes to new Firebase UIDs

## Security Considerations

### 7.1 Firestore Security Rules

When ready, configure Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin users can read all profiles
    match /users/{userId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 7.2 Authentication Security

- Enable email verification (already configured in the code)
- Consider enabling multi-factor authentication for admin accounts
- Monitor authentication logs in Firebase Console

## Troubleshooting

### Common Issues

1. **"Auth domain not configured"**
   - Add your domain to authorized domains in Firebase Console

2. **Google Sign-In not working**
   - Verify Google provider is enabled
   - Check that the API key and project ID are correct

3. **Email verification not sending**
   - Check Firebase Console → Authentication → Settings → Email templates
   - Verify email sending is enabled

4. **User profiles not saving**
   - Ensure Firestore is enabled and properly configured
   - Check browser console for JavaScript errors

### Debug Mode

Enable debug logging by adding this to your Firebase config for development:

```javascript
// Add to firebase-config.js for debugging
if (location.hostname === 'localhost') {
    // Uncomment for emulator testing
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all Firebase configuration values
3. Ensure authentication providers are properly enabled
4. Check Firebase Console for authentication logs

## Next Steps

After successful setup:

1. **Configure Firestore Security Rules** for production
2. **Set up monitoring** and analytics
3. **Implement user management** features
4. **Configure backup** and data export procedures
5. **Train users** on the new authentication system

---

**Note**: Keep your Firebase API keys secure and never commit them to public repositories. Use environment variables or secure configuration management in production.