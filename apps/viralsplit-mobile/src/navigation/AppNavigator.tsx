import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector } from '@/store';
import { RootStackParamList } from '@/types';

// Stack Navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Screens
import OnboardingScreen from '@/screens/OnboardingScreen';
import LoadingScreen from '@/screens/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  const { isOnboarded } = useAppSelector(state => state.ui);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isOnboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !isAuthenticated ? (
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{ animationTypeForReplace: 'pop' }}
        />
      ) : (
        <Stack.Screen 
          name="MainTabs" 
          component={MainNavigator}
          options={{ animationTypeForReplace: 'push' }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;