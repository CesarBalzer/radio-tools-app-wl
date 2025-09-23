// src/screens/PlayerScreen.tsx
import React, {useEffect, useMemo, useRef} from 'react';
import {View, Text, StyleSheet, Share, AccessibilityInfo, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme, type Theme} from '../theme/ThemeProvider';
import {useRemoteConfig} from '../config/RemoteConfigProvider';
import {useRadioPlayer} from '../hooks/useRadioPlayer';

import TopBar from '../components/TopBar';
import BannerCarousel from '../components/BannerCarousel';
import Controls from '../components/Controls';
import {mmss} from '../utils/format';
import BackgroundHero from '../components/BackgroundHero';
import {useNowPlaying} from '../hooks/useNowPlaying';

export default function PlayerScreen() {
  const theme = useTheme();
  const {streams, station, branding} = useRemoteConfig();

  const player = useRadioPlayer({
    label: station?.name || 'Rádio Ao Vivo',
    urls: [streams.radio.primaryUrl, ...(streams.radio.fallbackUrls || [])]
  });

  const now = useNowPlaying({
    playing: player.playing,
    metadataUrl: streams.radio.metadataUrl,
    streamUrl: player.currentUrl ?? streams.radio.primaryUrl
  });

  // ── Anúncios de acessibilidade ────────────────────────────────────────────────
  const lastAnnouncedRef = useRef<string | null>(null);

  // Estado de conexão/erro
  useEffect(() => {
    if (player.loading) {
      AccessibilityInfo.announceForAccessibility('Conectando ao áudio…');
    } else if (player.error) {
      AccessibilityInfo.announceForAccessibility(`Erro no player: ${player.error}`);
    }
  }, [player.loading, player.error]);

  // Agora tocando (evita repetir o mesmo anúncio)
  useEffect(() => {
    const line = [now?.artist, now?.title].filter(Boolean).join(' — ');
    if (!line) return;

    const msg = `Agora tocando: ${line}`;
    if (lastAnnouncedRef.current !== msg) {
      AccessibilityInfo.announceForAccessibility(msg);
      lastAnnouncedRef.current = msg;
    }
  }, [now?.artist, now?.title]);

  const placeholderHeroImages: string[] = [
    'https://placehold.co/1200x1200/333/FFFFFF.png?text=Banner+Radio+1',
    'https://placehold.co/1200x1200/333/FFFFFF.png?text=Banner+Radio+2',
    'https://placehold.co/1200x1200/333/FFFFFF.png?text=Banner+Radio+3'
  ];

  const heroImages = useMemo(() => {
    const out: string[] = [];
    const bAny: any = branding;
    if (Array.isArray(bAny?.bgImageUrls)) out.push(...bAny.bgImageUrls.filter(Boolean));
    if (branding?.bgImageUrl) out.push(branding.bgImageUrl);
    const sAny: any = station;
    if (Array.isArray(sAny?.heroImages)) out.push(...sAny.heroImages.filter(Boolean));
    const unique = Array.from(new Set(out));
    return unique.length ? unique : placeholderHeroImages;
  }, [branding, station]);

  const s = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView
      edges={['top']}
      style={[s.root, {backgroundColor: theme.colors.background}]}
      // A tela inteira é uma região principal
      accessibilityRole="summary"
      accessibilityLabel="Tela principal. Rádio ao vivo."
    >
      <View style={s.page}>
        <TopBar
          name={station?.name ?? 'Radio Tools'}
          genre={now.title || now.artist ? `${now.artist ? now.artist + ' — ' : ''}${now.title ?? ''}` : station?.genre ?? 'Ao vivo agora'}
          logoUrl={station?.logoUrl}
          artist={now.artist}
          title={now.title}
          onShare={({name, artist, title, logoUrl}) => {
            const msg = [
              artist && title ? `🎵 Tocando agora: ${artist} — ${title}` : null,
              name ? `📻 Rádio: ${name}` : null,
              station?.shareUrl ? `▶️ Ouça: ${station.shareUrl}` : null
            ]
              .filter(Boolean)
              .join('\n');

            Share.share({message: msg}).catch(() => {});
          }}
        />

        <View style={s.content}>

          {/* Barra de status: lida como texto e atualiza dinamicamente */}
          {(player && (player.loading || player.error)) && (
            <View
              style={[s.statusBar, {backgroundColor: theme.colors.primary}]}
              accessibilityRole="text"
              accessibilityLiveRegion={Platform.OS === 'android' ? 'polite' : undefined}
              accessible
            >
              {player.loading ? (
                <Text style={s.statusText} allowFontScaling>Conectando…</Text>
              ) : (
                <Text style={s.statusText} numberOfLines={1} allowFontScaling>
                  {player.error}
                </Text>
              )}
            </View>
          )}

          {/* Hero é decorativo → esconder descendentes do foco */}
          <View
            style={s.heroWrap}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <BackgroundHero images={heroImages} />
          </View>

          {/* Parceiros: rotulado, focável */}
          <View
            style={s.partnersWrap}
            accessibilityRole="summary"
            accessibilityLabel="Patrocinadores e parceiros"
          >
            <BannerCarousel partners={station?.partners ?? []} showDots={false} />
          </View>
        </View>

        <View style={[s.controlsWrap]} accessibilityLabel="Controles do player">
          <Controls
            volume={player.volume}
            setVolume={player.setVolume}
            playing={player.playing}
            onTogglePlay={player.togglePlay}
            onShare={() => player.share(station?.name, station?.shareUrl ?? player.currentUrl)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: 'transparent'},
    page: {flex: 1, backgroundColor: 'transparent'},
    content: {flex: 1},
    statusBar: {
      marginTop: 10,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(0,0,0,0.12)',
      borderRadius: 10
    },
    statusText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '600'
    },
    heroWrap: {
      flex: 1,
      overflow: 'hidden',
      paddingVertical: 10
    },
    partnersWrap: {
      // espaço para banners
    },
    controlsWrap: {
      paddingTop: 10
    }
  });
}
