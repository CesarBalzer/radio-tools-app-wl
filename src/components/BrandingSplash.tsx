import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme as useAppTheme } from '../theme/ThemeProvider';
import { useRemoteConfig } from '../config/RemoteConfigProvider';

export function BrandingSplash() {
  const t = useAppTheme();
  const cfg = useRemoteConfig();

  const bgImageUrl = t.assets.bgImageUrl || cfg?.branding?.bgImageUrl || null;
  const logoUrl = t.assets.logoUrl || cfg?.branding?.logoUrl || cfg?.station?.logoUrl || null;

  const [bgReady, setBgReady] = useState(!bgImageUrl);
  const [logoReady, setLogoReady] = useState(!logoUrl);

  const pulse = useMemo(() => new Animated.Value(0.35), []);
  const bgOpacity = useMemo(() => new Animated.Value(0), []);
  const logoOpacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.75, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (bgReady) {
      Animated.timing(bgOpacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
  }, [bgReady, bgOpacity]);

  useEffect(() => {
    if (logoReady) {
      Animated.timing(logoOpacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
  }, [logoReady, logoOpacity]);

  const showLogo = bgReady;

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      {!bgReady ? (
        <Animated.View style={[styles.skeleton, { opacity: pulse, backgroundColor: t.colors.card }]} />
      ) : null}

      {bgImageUrl ? (
        <Animated.Image
          source={{ uri: bgImageUrl }}
          style={[styles.bg, { opacity: bgOpacity }]}
          resizeMode="cover"
          onLoadEnd={() => setBgReady(true)}
          onError={() => setBgReady(true)}
        />
      ) : null}

      <View style={styles.overlay} />

      {logoUrl && showLogo ? (
        <Animated.Image
          source={{ uri: logoUrl }}
          style={[styles.logo, { opacity: logoOpacity }]}
          resizeMode="contain"
          onLoadEnd={() => setLogoReady(true)}
          onError={() => setLogoReady(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  skeleton: { ...StyleSheet.absoluteFillObject },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  logo: { width: 220, height: 220, maxWidth: '80%' },
});
