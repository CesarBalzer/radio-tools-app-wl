// src/screens/player/components/TopBar.tsx
import React, {useMemo, useCallback} from 'react';
import {Image, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {useCoverArt} from '../hooks/useCoverArt';
import {Ionicons} from '@expo/vector-icons';
import {readableOn, rgbaFromFg} from '../utils/format';
import {useRemoteConfigControls} from '../config/RemoteConfigProvider';

// lista de tenants para ciclar no dev
const TENANTS = ['cliente-aurora', 'cliente-radar', 'cliente-metro'] as const;

type Props = {
  name: string;
  genre: string;
  logoUrl?: string;
  onShare?: () => void;
  artist?: string;
  title?: string;
};

export default function TopBar({name, genre, logoUrl, onShare, artist, title}: Props) {
  const theme = useTheme();
  const {tenant, setTenant, refresh} = useRemoteConfigControls();

  const fg = useMemo(() => readableOn(theme.colors.primary), [theme.colors.primary]);
  const s = useMemo(() => styles(theme.colors.primary, fg), [theme.colors.primary, fg]);

  const coverUrl = useCoverArt(artist, title);

  const cycleTenant = useCallback(async () => {
    const idx = TENANTS.indexOf(tenant as any);
    const next = TENANTS[(idx >= 0 ? idx : 0) + 1 === TENANTS.length ? 0 : (idx >= 0 ? idx + 1 : 1)];
    await setTenant(next);
    // não precisa chamar refresh(); o provider já baixa ao trocar o tenant
  }, [tenant, setTenant]);

  return (
    <View style={s.topBar}>
      <View style={s.left}>
        {coverUrl ? (
          <Image source={{uri: coverUrl}} style={s.cover} resizeMode="cover" />
        ) : logoUrl ? (
          <Image source={{uri: logoUrl}} style={s.logo} resizeMode="contain" />
        ) : null}

        <View style={{flexShrink: 1}}>
          <Text style={[s.name, {color: fg}]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[s.sub, {color: rgbaFromFg(fg as any, 0.95)}]} numberOfLines={1}>
            {genre}
          </Text>
        </View>
      </View>

      <View style={s.actions}>
        {/* badge do tenant:
            - tap: alterna entre os 3
            - long-press: força refresh do atual */}
        <TouchableOpacity
          onPress={cycleTenant}
          onLongPress={refresh}
          delayLongPress={350}
          activeOpacity={0.75}
          style={[s.tenantBadge, {borderColor: fg, backgroundColor: rgbaFromFg(fg as any, 0.18)}]}
        >
          <Text style={[s.tenantTxt, {color: fg}]} numberOfLines={1}>
            {tenant}
          </Text>
        </TouchableOpacity>

        {!!onShare && (
          <TouchableOpacity onPress={onShare} style={[s.iconBtn, {backgroundColor: rgbaFromFg(fg as any, 0.18)}]}>
            <Ionicons name="share-social" size={22} color={fg} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = (primary: string, fg: string) =>
  StyleSheet.create({
    topBar: {
      backgroundColor: primary,
      paddingTop: 14,
      paddingBottom: 10,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    left: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
    logo: {width: 34, height: 34, borderRadius: 8, backgroundColor: 'transparent'},
    cover: {width: 44, height: 44, borderRadius: 8},
    name: {fontSize: 16, fontWeight: '800', letterSpacing: 0.3, maxWidth: 220},
    sub: {fontSize: 12, marginTop: 2},

    actions: {flexDirection: 'row', alignItems: 'center', gap: 8},

    tenantBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tenantTxt: {fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5},

    iconBtn: {paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10},
  });
