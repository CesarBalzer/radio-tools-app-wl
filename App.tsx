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
import { Ionicons } from '@expo/vector-icons';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();

export default function App() {
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
        initialRouteName="Rádio"
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
        <Tab.Screen
          name="Rádio"
          component={PlayerScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} color={color} size={size ?? 22} />
            ),
          }}
        />
        <Tab.Screen
          name="Live"
          component={LiveScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'videocam' : 'videocam-outline'} color={color} size={size ?? 22} />
            ),
          }}
        />
        <Tab.Screen
          name="Promos"
          component={PromosScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'pricetags' : 'pricetags-outline'} color={color} size={size ?? 22} />
            ),
          }}
        />
      </Tab.Navigator>

      <StatusBar style={theme.statusBarStyle} />
    </NavigationContainer>
  );
}
