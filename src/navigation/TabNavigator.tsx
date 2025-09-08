import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { RootTabParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getColors, spacing } from '../utils/theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SendPingScreen from '../screens/SendPingScreen';
import GroupsScreen from '../screens/GroupsScreen';
import StatusScreen from '../screens/StatusScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigator = () => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'SendPing':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Groups':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Status':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            default:
              iconName = 'help-outline';
          }



          return <Ionicons name={iconName} size={size || 24} color={color || colors.primary} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray100,
          paddingTop: spacing.xs,
          paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
          height: Platform.OS === 'ios' ? 90 : 70,
          elevation: 8,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        headerStyle: {
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray100,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.primary,
          fontSize: 18,
          fontWeight: '700',
        },
        headerTintColor: colors.primary,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Home',
          headerTitle: 'Recent Pings'
        }}
      />
      <Tab.Screen 
        name="SendPing" 
        component={SendPingScreen} 
        options={{ 
          title: 'Ping',
          headerTitle: 'Send Ping'
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen} 
        options={{ 
          title: 'Groups',
          headerTitle: 'My Groups'
        }}
      />
      <Tab.Screen 
        name="Status" 
        component={StatusScreen} 
        options={{ 
          title: 'Status',
          headerTitle: 'My Status'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profile',
          headerTitle: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator; 