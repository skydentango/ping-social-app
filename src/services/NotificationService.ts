import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Deprecated but keeping for backwards compatibility
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // New way to show alerts
    shouldShowList: true, // Show in notification center
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token || null;
}

export async function sendPingNotification(
  expoPushToken: string,
  senderName: string,
  message: string,
  groupName: string
) {
  const messageBody = {
    to: expoPushToken,
    sound: 'default',
    title: `New Ping from ${senderName}`,
    body: `${groupName}: ${message}`,
    data: { 
      type: 'ping',
      senderName,
      message,
      groupName,
    },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageBody),
  });
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    onNotificationReceived?.(notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    onNotificationResponse?.(response);
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

// Schedule a local notification (for immediate in-app notifications)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // null means immediate
  });
} 