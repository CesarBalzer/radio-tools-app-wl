// src/components/BannerCarousel.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ImageBackground, ScrollView, Text, View, StyleSheet, useWindowDimensions} from 'react-native';
import {useTheme, type Theme} from '../theme/ThemeProvider';

type Partner = {imageUrl: string; title?: string; href?: string};
type Props = {partners: Partner[]; showDots?: boolean};

function withAlpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const to255 = (s: string) => parseInt(s, 16);
  const r = h.length === 3 ? to255(h[0] + h[0]) : to255(h.slice(0, 2));
  const g = h.length === 3 ? to255(h[1] + h[1]) : to255(h.slice(2, 4));
  const b = h.length === 3 ? to255(h[2] + h[2]) : to255(h.slice(4, 6));
  return `rgba(${r},${g},${b},${a})`;
}

const RADIUS = 10;

export default function BannerCarousel({partners, showDots = true}: Props) {
  const theme = useTheme();
  const {width} = useWindowDimensions();
  const s = styles(theme);
  const scrollRef = useRef<ScrollView>(null);
  const list = useMemo(() => partners ?? [], [partners]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!list.length) return;
    const id = setInterval(() => {
      setIndex(i => {
        const next = (i + 1) % list.length;
        scrollRef.current?.scrollTo({x: next * width, animated: true});
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [list.length, width]);

  return (
    <View>
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
          >
            {list.map((b, idx) => (
              <ImageBackground
                key={idx}
                source={{uri: b.imageUrl}}
                style={[s.banner, {width}]}
                imageStyle={s.bannerImg}
              >
                <View style={s.overlay} />
                {b.title ? (
                  <View style={s.titleWrap}>
                    <Text style={s.title}>{b.title}</Text>
                  </View>
                ) : null}
              </ImageBackground>
            ))}
          </ScrollView>

          {showDots ? (
            <View style={s.dots}>
              {list.map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.dot,
                    {backgroundColor: i === index ? theme.colors.text : withAlpha(theme.colors.text, 0.28)},
                  ]}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <View style={[s.fallback, {width}]}>
          <Text style={s.fallbackTxt}>RADIO TOOLS</Text>
          <Text style={s.fallbackSub}>Mobile Apps & Websites</Text>
        </View>
      )}
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    banner: {height: 180, justifyContent: 'center', alignItems: 'center'},
    bannerImg: {resizeMode: 'cover', borderRadius: RADIUS, backgroundColor: withAlpha(t.colors.primary, 0.2)},
    overlay: {...StyleSheet.absoluteFillObject, borderRadius: RADIUS, backgroundColor: withAlpha(t.colors.background, 0.28)},
    titleWrap: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: withAlpha(t.colors.card, 0.92),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    title: {fontWeight: '900', fontSize: 18, letterSpacing: 0.5, color: t.colors.text},

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
    fallbackTxt: {fontSize: 34, fontWeight: '900', letterSpacing: 1, color: t.colors.text},
    fallbackSub: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: t.colors.primary,
      color: t.colors.text,
    },

    dots: {flexDirection: 'row', alignSelf: 'center', marginTop: 10, gap: 6},
    dot: {width: 7, height: 7, borderRadius: 10},
  });
