# 📱 Ping - Social Coordination App

Ping is a lightweight, real-time social coordination app built with React Native, Expo, and Firebase. It lets users quickly send a "Ping" to specific groups of friends to see who's available to hang out right now, focusing on spontaneous meetups rather than planned events.

## ✨ Features

### 🔐 Authentication
- Firebase Auth with email/password
- Persistent login sessions
- User registration with display names

### 🏠 Core Functionality
- **Home Screen**: View recent pings and respond (Yes/No/Maybe)
- **Send Ping**: Choose a group and send a message
- **Groups**: Create/edit/delete groups of friends
- **Status**: Set current vibe (e.g., "Free", "Busy", "Studying")
- **Profile**: View user info and account settings

### 🔔 Real-time Features
- Push notifications for new pings
- Real-time ping responses
- Live status updates

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development) or Android emulator
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ping
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Firebase project credentials (see step 4).

4. **Configure Firebase**
   
   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   
   b. Enable the following services:
   - Authentication (Email/Password provider)
   - Firestore Database
   
   c. Get your Firebase config from Project Settings > General > Your apps
   
   d. Update your `.env` file with your Firebase configuration:
   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

5. **Set up Firestore Security Rules**
   
   Go to Firestore Database > Rules and update with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own user document
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Users can read/write groups they're members of
       match /groups/{groupId} {
         allow read, write: if request.auth != null && 
           request.auth.uid in resource.data.members;
         allow create: if request.auth != null;
       }
       
       // Users can read pings from groups they're in
       // Users can create pings and update responses
       match /pings/{pingId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update: if request.auth != null;
       }
     }
   }
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 📱 Usage

### First Time Setup
1. **Register**: Create an account with email and display name
2. **Set Status**: Choose your current vibe from the Status tab
3. **Create Groups**: Add friend groups in the Groups tab
4. **Send Pings**: Use the Send Ping tab to coordinate with friends
5. **Respond**: Check the Home tab for incoming pings and respond

### Sending a Ping
1. Go to the "Send Ping" tab
2. Select a group
3. Write a message (e.g., "Anyone down to get boba?")
4. Tap "Send Ping"

### Responding to Pings
1. Check the "Home" tab for recent pings
2. Tap Yes ✅, Maybe 🤔, or No ❌ to respond
3. See real-time response summaries

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Auth + Firestore)
- **Navigation**: React Navigation v6
- **Notifications**: Expo Notifications
- **Icons**: Expo Vector Icons
- **Language**: TypeScript

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation setup
│   ├── AuthNavigator.tsx
│   └── TabNavigator.tsx
├── screens/            # App screens
│   ├── HomeScreen.tsx
│   ├── SendPingScreen.tsx
│   ├── GroupsScreen.tsx
│   ├── StatusScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── LoginScreen.tsx
│   └── RegisterScreen.tsx
├── services/           # Firebase and other services
│   ├── firebase.ts
│   ├── AuthContext.tsx
│   └── NotificationService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Utility functions
```

## 🔔 Push Notifications Setup

For push notifications to work properly:

1. **Development**: Notifications work in Expo Go app
2. **Production**: Build with EAS Build for full notification support

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for testing
eas build --platform ios --profile development
eas build --platform android --profile development
```

## 🚀 Deployment

### Using EAS Build & Submit

1. **Configure EAS**
   ```bash
   eas build:configure
   ```

2. **Build for production**
   ```bash
   eas build --platform all --profile production
   ```

3. **Submit to app stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Firebase connection issues**
   - Ensure your Firebase config is correct
   - Check that Authentication and Firestore are enabled
   - Verify Firestore security rules

2. **Push notification issues**
   - Use a physical device for testing
   - Ensure notification permissions are granted
   - Check Expo push notification service status

3. **Build issues**
   - Clear Expo cache: `expo r -c`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

### Getting Help

- Create an issue in the repository
- Check Expo documentation: [docs.expo.dev](https://docs.expo.dev)
- Firebase documentation: [firebase.google.com/docs](https://firebase.google.com/docs)

---

Built with ❤️ using React Native & Expo 