import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from '../contexts/AuthContext';

import IndexScreen from './Home';
import LoginScreen from './auth/Login';
import ErrorScreen from './auth/Error';
import FrontScreen from './main/Front';
import WaitScreen from './auth/Wait';

const Stack = createNativeStackNavigator();

export default function RootNavigation() {
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('oauth2redirect')) {
        return;
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <AuthProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {}
        <Stack.Screen name="index" component={IndexScreen} />
        <Stack.Screen name="front" component={FrontScreen} />
        <Stack.Screen name="error" component={ErrorScreen} />
        <Stack.Screen name="login" component={LoginScreen} />
        <Stack.Screen name="wait" component={WaitScreen} />
      </Stack.Navigator>
    </AuthProvider>
  );
}
