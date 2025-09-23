// src/components/BannerCarousel.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ImageBackground,
  ScrollView,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
  AccessibilityInfo,
  Pressable,
  Linking,
} from 'react-native';
import {useTheme, type Theme} from '../theme/ThemeProvider';
import {withAlpha} from '../utils/format';

type Partner = { imageUrl: string; title?: string; href?: string };
type Props = { partners: Partner[]; showDots?: boolean };

const RADIUS = 10;

export default function BannerCarousel({ partners, showDots = true }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const s = styles(theme);
  const scrollRef = useRef<ScrollView>(null);
  const list = useMemo(() => partners ?? [], [partners]);

  const [index, setIndex] = useState(0);
  const [screenReaderOn, setScreenReaderOn] = useState(false);
  const [interacting, setInteracting] = useState(false);

  // Detecta leitor de tela para pausar autoplay
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then(enabled => mounted && setScreenReaderOn(Boolean(enabled)))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('screenReaderChanged', enabled => {
      setScreenReaderOn(Boolean(enabled));
    });
    return () => {
      sub?.remove?.();
      mounted = false;
    };
  }, []);

  // Autoplay: pausa se leitor de tela estiver ativo ou se usuário estiver interagindo
  useEffect(() => {
    if (!list.length || screenReaderOn || interacting) return;
    const id = setInterval(() => {
      setIndex(i => {
        const next = (i + 1) % list.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [list.length, width, screenReaderOn, interacting]);

  const onDotPress = (i: number) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  const openLink = async (href?: string) => {
    if (!href) return;
    try {
      await Linking.openURL(href);
    } catch {}
  };

  return (
    <View accessibilityLabel={`Carrossel de banners com ${list.length || 0} itens.`}>
      {list.length ? (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={e => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              if (i !== index) setIndex(i);
            }}
            scrollEventThrottle={16}
            onTouchStart={() => setInteracting(true)}
            onTouchEnd={() => setInteracting(false)}
            onScrollBeginDrag={() => setInteracting(true)}
            onScrollEndDrag={() => setInteracting(false)}
            accessibilityRole="scrollbar"
            accessibilityLabel="Banners de parceiros. Deslize para ver mais."
          >
            {list.map((b, idx) => {
              const labelBase = b.title?.trim() || `Banner ${idx + 1} de ${list.length}`;
              const a11yLabel = b.href ? `${labelBase}. Abre link do parceiro.` : labelBase;

              return (
                <Pressable
                  key={idx}
                  onPress={() => openLink(b.href)}
                  disabled={!b.href}
                  style={{ width }}
                  accessibilityRole={b.href ? 'link' : 'image'}
                  accessibilityLabel={a11yLabel}
                  accessibilityHint={b.href ? 'Duplo toque para abrir.' : undefined}
                >
                  <ImageBackground
                    source={{ uri: b.imageUrl }}
                    style={[s.banner]}
                    imageStyle={s.bannerImg}
                    // a imagem é puramente visual; o Pressable acima cuida da a11y
                    accessible={false}
                    importantForAccessibility="no-hide-descendants"
                  >
                    <View style={s.overlay} />
                    {b.title ? (
                      <View style={s.titleWrap}>
                        <Text style={s.title} allowFontScaling numberOfLines={2}>
                          {b.title}
                        </Text>
                      </View>
                    ) : null}
                  </ImageBackground>
                </Pressable>
              );
            })}
          </ScrollView>

          {showDots ? (
            <View style={s.dots} accessibilityLabel="Indicadores do carrossel">
              {list.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => onDotPress(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ir para o slide ${i + 1} de ${list.length}`}
                  accessibilityState={{ selected: i === index }}
                >
                  <View
                    style={[
                      s.dot,
                      {
                        backgroundColor:
                          i === index ? theme.colors.text : withAlpha(theme.colors.text, 0.28),
                      },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <View style={[s.fallback, { width }]} accessibilityRole="summary" accessibilityLabel="Área de parceiros">
          <Text style={s.fallbackTxt} allowFontScaling numberOfLines={1}>
            RADIO TOOLS
          </Text>
          <Text style={s.fallbackSub} allowFontScaling numberOfLines={1}>
            Mobile Apps & Websites
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    banner: { height: 180, justifyContent: 'center', alignItems: 'center' },
    bannerImg: {
      resizeMode: 'cover',
      borderRadius: RADIUS,
      backgroundColor: withAlpha(t.colors.primary, 0.2),
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: RADIUS,
      backgroundColor: withAlpha(t.colors.background, 0.28),
    },
    titleWrap: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: withAlpha(t.colors.card, 0.92),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    title: { fontWeight: '900', fontSize: 18, letterSpacing: 0.5, color: t.colors.text },

    fallback: {
      height: 260,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS,
      alignSelf: 'center',
      marginHorizontal: 14,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.card,
    },
    fallbackTxt: { fontSize: 34, fontWeight: '900', letterSpacing: 1, color: t.colors.text },
    fallbackSub: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: t.colors.primary,
      color: t.colors.text,
    },

    dots: { flexDirection: 'row', alignSelf: 'center', marginTop: 10, gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 12 },
  });
