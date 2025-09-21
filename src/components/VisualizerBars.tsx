// src/components/VisualizerBars.tsx
import React, {useEffect, useMemo, useRef} from 'react';
import {View, Animated, Easing, StyleSheet} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';

type Props = {
  active?: boolean;   // tocar animação (true quando tocando)
  bars?: number;      // quantidade de barras
  height?: number;    // altura máxima
  width?: number;     // largura total (opcional)
  speedMs?: number;   // velocidade do ciclo
};

const GAP = 4;
const BAR_W = 4;
const RADIUS = 4; // sem depender do theme

export default function VisualizerBars({active = true, bars = 24, height = 48, width, speedMs = 900}: Props) {
  const theme = useTheme();
  const s = useMemo(() => styles(height), [height]);

  // Animated.Values para cada barra
  const values = useRef(Array.from({length: bars}, () => new Animated.Value(0))).current;

  // anima uma barra
  const animateBar = (v: Animated.Value, delay = 0) => {
    const up = Animated.timing(v, {
      toValue: 1,
      duration: speedMs * (0.4 + Math.random() * 0.6),
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
      delay
    });
    const down = Animated.timing(v, {
      toValue: 0.2,
      duration: speedMs * (0.5 + Math.random() * 0.5),
      easing: Easing.in(Easing.quad),
      useNativeDriver: false
    });
    return Animated.sequence([up, down]);
  };

  // loop geral
  useEffect(() => {
    let loops: Animated.CompositeAnimation[] = [];
    if (active) {
      loops = values.map((v, i) => {
        const loop = Animated.loop(animateBar(v, i * 35));
        loop.start();
        return loop;
      });
    } else {
      // colapsa suavemente quando pausa
      values.forEach((v) => {
        Animated.timing(v, {toValue: 0.1, duration: 300, useNativeDriver: false}).start();
      });
    }
    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [active, speedMs, values]);

  // largura total
  const totalWidth = width ?? bars * BAR_W + (bars - 1) * GAP;

  return (
    <View style={[s.wrap, {width: totalWidth}]}>
      {values.map((v, i) => {
        const h = v.interpolate({
          inputRange: [0, 1],
          outputRange: [height * 0.15, height]
        });
        // mesma cor, variação via opacity (sem helpers)
        const barOpacity = i % 3 === 0 ? 1 : 0.65;

        return (
          <Animated.View
            key={i}
            style={[
              s.bar,
              {
                height: h,
                backgroundColor: theme.colors.primary,
                opacity: barOpacity
              }
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = (maxH: number) =>
  StyleSheet.create({
    wrap: {
      alignSelf: 'center',
      height: maxH,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: GAP,
      paddingVertical: 8
    },
    bar: {
      width: BAR_W,
      borderTopLeftRadius: RADIUS,
      borderTopRightRadius: RADIUS
    }
  });
