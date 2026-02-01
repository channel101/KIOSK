import { useEffect } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { ThemeProvider } from '@rneui/themed';
import { StatusBar, Platform, NativeModules, BackHandler } from 'react-native';
import ImmersiveMode from 'react-native-immersive-mode';
import Toast from 'react-native-toast-message';
import { activate, deactivate } from '@thehale/react-native-keep-awake';

import RootNavigator from './src/navigation/RootNavigation';
import GlobalNetworkGuard from './src/components/GlobalNetworkGuard';
import { AuthProvider } from './src/contexts/AuthContext';
import { StoreProvider } from './src/contexts/StoreContext';
import { CartProvider } from './src/contexts/CartContext';
import { useAuth } from './src/hooks/useAuth';

const { KioskModule, HomeShortcut } = NativeModules;

export const navigationRef = createNavigationContainerRef();

function AuthGate() {
  useAuth(navigationRef);
  return null;
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    if (HomeShortcut) {
      HomeShortcut.addShortcut(
        'app',
        'TREE KIOSK V5',
        'treekiosk.v5://shortcut',
      ).finally(() => {
        setTimeout(() => {
          if (!KioskModule) return;

          KioskModule.isAccessibilityServiceEnabled()
            .then(enabled => {
              if (!enabled) {
                KioskModule.openAccessibilitySettings();
              }
            })
            .catch(() => {});
        }, 500);
      });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      ImmersiveMode.fullLayout(true);
      ImmersiveMode.setBarMode('BottomSticky');
    }
    return () => {
      if (Platform.OS === 'android') {
        ImmersiveMode.setBarMode('Normal');
      }
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    activate();
    return () => deactivate();
  }, []);

  return (
    <>
      <GlobalNetworkGuard />
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <ThemeProvider>
              <StatusBar hidden />
              <NavigationContainer ref={navigationRef}>
                <AuthGate />
                <RootNavigator />
              </NavigationContainer>
              <Toast />
            </ThemeProvider>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </>
  );
}
