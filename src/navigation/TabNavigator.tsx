import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { RootTabParamList } from '../types';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SendPingScreen from '../screens/SendPingScreen';
import GroupsScreen from '../screens/GroupsScreen';
import StatusScreen from '../screens/StatusScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let emoji: string;

          if (route.name === 'Home') {
            emoji = focused ? '🏠' : '🏡';
          } else if (route.name === 'SendPing') {
            emoji = focused ? '📱' : '📲';
          } else if (route.name === 'Groups') {
            emoji = focused ? '👥' : '👤';
          } else if (route.name === 'Status') {
            emoji = focused ? '😊' : '🙂';
          } else if (route.name === 'Profile') {
            emoji = focused ? '👨‍💼' : '👤';
          } else {
            emoji = '❓';
          }

          return (
            <Text style={{ fontSize: size, color: focused ? '#007AFF' : '#8E8E93' }}>
              {emoji}
            </Text>
          );
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Recent Pings' }}
      />
      <Tab.Screen 
        name="SendPing" 
        component={SendPingScreen} 
        options={{ title: 'Send Ping' }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen} 
        options={{ title: 'My Groups' }}
      />
      <Tab.Screen 
        name="Status" 
        component={StatusScreen} 
        options={{ title: 'My Status' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator; 