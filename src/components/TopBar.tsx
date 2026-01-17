// src/screens/player/components/TopBar.tsx
import React, {useMemo, useEffect, useRef} from 'react';
import {Image, Text, View, StyleSheet, AccessibilityInfo} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {useCoverArt} from '../hooks/useCoverArt';
import {readableOn, rgbaFromFg} from '../utils/format';
import {ShareProps} from '../types';
import {useItunesTrack} from '../hooks/useItunesTrack';

export default function TopBar({name, genre, logoUrl, onShare, artist, title}: ShareProps) {
  const theme = useTheme();
  const fg = useMemo(() => readableOn(theme.colors.primary), [theme.colors.primary]);
  const s = useMemo(() => styles(theme.colors.primary, fg), [theme.colors.primary, fg]);

  const {track: itunesTrack} = useItunesTrack(artist, title);
  const coverUrl = useCoverArt(artist, title);

  const lastRef = useRef<string | null>(null);
  useEffect(() => {
    const line = [artist, title].filter(Boolean).join(' — ');
    if (!line) return;
    const msg = `Cabeçalho atualizado: ${line}`;
    if (lastRef.current !== msg) {
      AccessibilityInfo.announceForAccessibility(msg);
      lastRef.current = msg;
    }
  }, [artist, title]);

  const coverA11yLabel = coverUrl
    ? `Capa do álbum${artist || title ? `, ${[artist, title].filter(Boolean).join(' — ')}` : ''}`
    : undefined;

  const logoA11yLabel = logoUrl ? `Logo da rádio ${name ?? ''}`.trim() : undefined;

  return (
    <View
      style={s.topBar}
      accessibilityRole="header"
      accessibilityLabel={`Topo. ${name ?? 'Rádio'}. ${genre ? `Agora: ${genre}` : ''}`}
    >
      <View style={s.left}>
        {coverUrl ? (
          <Image
            source={{uri: coverUrl}}
            style={s.cover}
            resizeMode="cover"
            accessible
            accessibilityLabel={coverA11yLabel}
          />
        ) : logoUrl ? (
          <Image
            source={{uri: logoUrl}}
            style={s.logo}
            resizeMode="contain"
            accessible
            accessibilityLabel={logoA11yLabel}
          />
        ) : null}

        <View style={s.textCol} accessible accessibilityRole="text" accessibilityLabel={`${name ?? ''}. ${genre ?? ''}`}>
          <Text style={[s.name, {color: fg}]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling>
            {name}
          </Text>
          {!!itunesTrack?.artistName && (
            <Text style={[s.artist, {color: fg}]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling>
              {itunesTrack.artistName}
            </Text>
          )}
          <Text style={[s.sub, {color: rgbaFromFg(fg as any, 0.95)}]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling>
            {genre}
          </Text>
        </View>
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
      // borderBottomWidth:1
    },
    left: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0},
    textCol: {flex: 1, minWidth: 0},
    logo: {width: 50, height: 50, borderRadius: 8, backgroundColor: 'transparent'},
    cover: {width: 50, height: 50, borderRadius: 8},
    name: {fontSize: 16, fontWeight: '800', letterSpacing: 0.3, flexShrink: 1},
    artist: {fontSize: 14, fontWeight: '500', fontStyle: 'italic', letterSpacing: 0.3, flexShrink: 1},
    sub: {fontSize: 12, marginTop: 2, flexShrink: 1},
  });
