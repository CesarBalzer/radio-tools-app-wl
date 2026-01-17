// App.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme as useAppTheme } from './src/theme/ThemeProvider';
import { useRemoteConfigProvider } from './src/config/RemoteConfigProvider';
import { useRemoteConfig } from './src/config/RemoteConfigProvider'; 
import PlayerScreen from './src/screens/PlayerScreen';
import LiveScreen from './src/screens/LiveScreen';
import PromosScreen from './src/screens/PromosScreen';
import { Ionicons } from '@expo/vector-icons';
import { luminanceOf } from './src/utils/format';
import { useConfigAutoRefresh } from './src/hooks/useConfigAutoRefresh';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();

function useAndroidNavBarTheming() {
  const t = useAppTheme();
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const bg = t.colors.card;
    const btnStyle = luminanceOf(bg) > 0.55 ? 'dark' : 'light';
    NavigationBar.setBackgroundColorAsync(bg).catch(() => {});
    NavigationBar.setButtonStyleAsync(btnStyle as 'light' | 'dark').catch(() => {});
    NavigationBar.setBorderColorAsync('#00000000').catch(() => {});
  }, [Platform.OS, t.colors.card, t.colors.background]);
}

function BrandingSplash() {
  const t = useAppTheme();
  const cfg = useRemoteConfig(); 
  const logo = t.assets.logoUrl || cfg?.station?.logoUrl;

  return (
    <View style={[stylesSplash.wrap, { backgroundColor: t.colors.background }]}>
      {!!logo && (
        <Image
          source={{ uri: logo }}
          style={stylesSplash.logo}
          resizeMode="contain"
          onError={() => {}}
        />
      )}
    </View>
  );
}


function ReadyApp({ isReady, children }: { isReady: boolean; children: React.ReactNode }) {
  const [showOverlay, setShowOverlay] = useState(false);
  const didHideRef = useRef(false);
  const t = useAppTheme();

  const logoUrl = t.assets.logoUrl;

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!isReady || didHideRef.current) return;

      if (logoUrl) {
        try {
          await Image.prefetch(logoUrl);
        } catch {}
      }

      try {
        await SplashScreen.hideAsync();
        didHideRef.current = true;
      } catch {}

      if (!mounted) return;
      setShowOverlay(true);
      setTimeout(() => {
        if (mounted) setShowOverlay(false);
      }, 400);
    }

    run();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, logoUrl]);

  if (!isReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      {showOverlay ? (
        <View style={StyleSheet.absoluteFill}>
          <BrandingSplash />
        </View>
      ) : null}
    </View>
  );
}

export default function App() {
  const { isReady, ConfigProvider } = useRemoteConfigProvider();

  return (
    <ConfigProvider>
      <ThemeProvider>
        <ReadyApp isReady={isReady}>
          <AppMain />
        </ReadyApp>
      </ThemeProvider>
    </ConfigProvider>
  );
}

function AppMain() {
  const theme = useAppTheme();
  useAndroidNavBarTheming();

  useConfigAutoRefresh();

  return (
    <NavigationContainer theme={theme.navigationTheme}>
      <Tabs />
      <StatusBar style={theme.statusBarStyle} />
    </NavigationContainer>
  );
}

function Tabs() {
  const theme = useAppTheme();
  return (
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
  );
}

const stylesSplash = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 220,
    height: 220,
  },
});
