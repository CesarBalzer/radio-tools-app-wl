// App.tsx
import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme as useAppTheme } from './src/theme/ThemeProvider';
import { useRemoteConfigProvider } from './src/config/RemoteConfigProvider';

import PlayerScreen from './src/screens/PlayerScreen';
import LiveScreen from './src/screens/LiveScreen';
import PromosScreen from './src/screens/PromosScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();

export default function App() {
  // carrega a remote config antes da UI
  const { isReady, ConfigProvider } = useRemoteConfigProvider();

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <ConfigProvider>
      <ThemeProvider>
        <AppMain />
      </ThemeProvider>
    </ConfigProvider>
  );
}

function AppMain() {
  const theme = useAppTheme();

  return (
    <NavigationContainer theme={theme.navigationTheme}>
      <Tab.Navigator
        initialRouteName="Player"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
        }}
      >
        <Tab.Screen name="Player" component={PlayerScreen} />
        <Tab.Screen name="Live" component={LiveScreen} />
        <Tab.Screen name="Promos" component={PromosScreen} />
      </Tab.Navigator>

      <StatusBar style={theme.statusBarStyle} />
    </NavigationContainer>
  );
}
