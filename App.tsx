import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from './src/services/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/services/NotificationService';

const AppContent = () => {
  const { user, loading, updatePushToken } = useAuth();

  useEffect(() => {
    if (user) {
      // Register for push notifications
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          updatePushToken(token).catch(err => 
            console.log('Failed to save push token:', err)
          );
        }
      });

      // Set up notification listeners
      const cleanup = setupNotificationListeners(
        (notification) => {
          // When notification is received while app is open
          console.log('Notification received:', notification);
        },
        (response) => {
          // When user taps on notification
          console.log('Notification tapped:', response);
        }
      );

      return cleanup;
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

