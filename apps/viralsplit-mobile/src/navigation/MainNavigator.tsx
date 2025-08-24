import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

// Tab Screens
import HomeScreen from '@/screens/main/HomeScreen';
import CameraScreen from '@/screens/camera/CameraScreen';
import LibraryScreen from '@/screens/main/LibraryScreen';
import AnalyticsScreen from '@/screens/main/AnalyticsScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

// Modal/Stack Screens
import VideoReviewScreen from '@/screens/camera/VideoReviewScreen';
import PlatformSelectionScreen from '@/screens/processing/PlatformSelectionScreen';
import ProcessingStatusScreen from '@/screens/processing/ProcessingStatusScreen';
import ResultsScreen from '@/screens/processing/ResultsScreen';
import AIScriptWriterScreen from '@/screens/features/AIScriptWriterScreen';
import MagicEditorScreen from '@/screens/features/MagicEditorScreen';
import ContentRemixerScreen from '@/screens/features/ContentRemixerScreen';
import SettingsScreen from '@/screens/main/SettingsScreen';
import CreditsScreen from '@/screens/main/CreditsScreen';
import SubscriptionScreen from '@/screens/main/SubscriptionScreen';

import { RootStackParamList, BottomTabParamList } from '@/types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Custom tab bar icon component
const TabIcon: React.FC<{
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}> = ({ name, color, size, focused }) => (
  <View style={{ 
    padding: 8,
    borderRadius: 20,
    backgroundColor: focused ? 'rgba(147, 51, 234, 0.1)' : 'transparent'
  }}>
    <Ionicons name={name} size={size} color={color} />
  </View>
);

// Main Tab Navigator
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#9333EA',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Camera':
              iconName = focused ? 'videocam' : 'videocam-outline';
              break;
            case 'Library':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <TabIcon name={iconName} color={color} size={size} focused={focused} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarStyle: { display: 'none' }, // Hide tab bar on camera screen
        }}
      />
      <Tab.Screen 
        name="Library" 
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator (includes tabs and modal screens)
const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
        presentation: 'card',
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen name="MainTabs" component={MainTabs} />
      
      {/* Camera Flow - Removed duplicate Camera screen as it's already in tabs */}
      <Stack.Screen 
        name="VideoReview" 
        component={VideoReviewScreen}
        options={{ 
          presentation: 'card',
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                  }),
                },
              ],
            },
          })
        }}
      />
      
      {/* Processing Flow */}
      <Stack.Screen name="PlatformSelection" component={PlatformSelectionScreen} />
      <Stack.Screen name="ProcessingStatus" component={ProcessingStatusScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      
      {/* Feature Screens */}
      <Stack.Screen 
        name="AIScriptWriter" 
        component={AIScriptWriterScreen}
        options={{ 
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="MagicEditor" 
        component={MagicEditorScreen}
        options={{ 
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="ContentRemixer" 
        component={ContentRemixerScreen}
        options={{ 
          presentation: 'modal',
        }}
      />
      
      {/* Profile/Settings */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Credits" component={CreditsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;