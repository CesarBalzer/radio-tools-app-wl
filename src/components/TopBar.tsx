// src/screens/player/components/TopBar.tsx
import React, {useMemo, useCallback, useState, useEffect, useRef} from 'react';
import {Image, Text, TouchableOpacity, View, StyleSheet, AccessibilityInfo} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {useCoverArt} from '../hooks/useCoverArt';
import {Ionicons} from '@expo/vector-icons';
import {readableOn, rgbaFromFg} from '../utils/format';
import {ShareProps} from '../types';
import {useItunesTrack} from '../hooks/useItunesTrack';
import TrackModal from './TrackModal';

export default function TopBar({name, genre, logoUrl, onShare, artist, title}: ShareProps) {
  const theme = useTheme();
  const fg = useMemo(() => readableOn(theme.colors.primary), [theme.colors.primary]);
  const s = useMemo(() => styles(theme.colors.primary, fg), [theme.colors.primary, fg]);

  const [modalVisible, setModalVisible] = useState(false);

  const {track: itunesTrack} = useItunesTrack(artist, title);
  const coverUrl = useCoverArt(artist, title);

  // Anunciar atualização do cabeçalho quando mudar faixa (só se título/artista existirem)
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

  const handleShare = useCallback(() => {
    if (!onShare) return;
    onShare({name, artist, title, logoUrl, coverUrl});
  }, [onShare, name, artist, title, logoUrl, coverUrl]);

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
          {/* Exibe artista do iTunes se disponível, senão mantém o seu "genre" abaixo */}
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

      <View style={s.actions} accessibilityRole="toolbar" accessibilityLabel="Ações do topo">
        {!!itunesTrack && (
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[s.iconBtn, {backgroundColor: rgbaFromFg(fg as any, 0.18)}]}
            accessibilityRole="button"
            accessibilityLabel="Ver detalhes da faixa"
            accessibilityHint="Abre detalhes da música em reprodução"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <Ionicons name="information-circle-outline" size={22} color={fg} />
          </TouchableOpacity>
        )}

        {!!onShare && (
          <TouchableOpacity
            onPress={handleShare}
            style={[s.iconBtn, {backgroundColor: rgbaFromFg(fg as any, 0.18)}]}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar"
            accessibilityHint="Compartilha o que está tocando agora"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <Ionicons name="share-social" size={22} color={fg} />
          </TouchableOpacity>
        )}
      </View>

      <TrackModal visible={modalVisible} onClose={() => setModalVisible(false)} track={itunesTrack ?? null} />
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
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10
    },
    left: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0},
    textCol: {flex: 1, minWidth: 0},
    logo: {width: 50, height: 50, borderRadius: 8, backgroundColor: 'transparent'},
    cover: {width: 50, height: 50, borderRadius: 8},
    name: {fontSize: 16, fontWeight: '800', letterSpacing: 0.3, flexShrink: 1},
    artist: {fontSize: 14, fontWeight: '500', fontStyle: 'italic', letterSpacing: 0.3, flexShrink: 1},
    sub: {fontSize: 12, marginTop: 2, flexShrink: 1},
    actions: {flexDirection: 'row', alignItems: 'center', gap: 8},
    tenantBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center'
    },
    tenantTxt: {fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5},
    iconBtn: {paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center'}
  });
