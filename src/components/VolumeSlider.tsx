// src/components/VolumeSlider.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, PanResponder, View, StyleSheet, LayoutChangeEvent, AccessibilityActionEvent} from 'react-native';

type Props = {
  value: number; // 0..1
  onChange?: (v: number) => void; // durante o arrasto
  onRelease?: (v: number) => void; // ao soltar / tap
  activeColor?: string; // trilho ativo + thumb
  inactiveColor?: string; // trilho inativo
  height?: number; // altura da área (default 44)
  trackHeight?: number; // espessura do trilho (default 3)
  thumbSize?: number; // diâmetro da bolinha (default 20)
  accessibilityLabel?: string;
};

export default function VolumeSlider({
  value,
  onChange,
  onRelease,
  activeColor = '#FFF',
  inactiveColor = 'rgba(255,255,255,0.35)',
  height = 44,
  trackHeight = 3,
  thumbSize = 20,
  accessibilityLabel = 'Controle de volume'
}: Props) {
  const [width, setWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current; // 0..1
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const STEP = 0.05; // 5% por gesto do leitor de tela

  // sincroniza com prop externa
  useEffect(() => {
    progress.setValue(clamp(value));
  }, [value]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const setFromX = (x: number, final = false) => {
    if (width <= 0) return;
    const v = clamp(x / width);
    progress.setValue(v);
    onChange?.(v);
    if (final) onRelease?.(v);
  };

  const setFromValue = (v: number, final = false) => {
    const nv = clamp(v);
    progress.setValue(nv);
    onChange?.(nv);
    if (final) onRelease?.(nv);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          setFromX(x, false);
        },
        onPanResponderMove: (evt, gesture) => {
          const baseX = evt.nativeEvent.locationX;
          const dx = gesture.dx;
          const x = Math.min(width, Math.max(0, baseX + dx));
          setFromX(x, false);
        },
        onPanResponderRelease: (evt) => {
          setFromX(evt.nativeEvent.locationX, true);
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: (evt) => {
          setFromX(evt.nativeEvent.locationX, true);
        }
      }),
    [width]
  );

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, width - thumbSize)]
  });
  const activeWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width]
  });

  // valor atual para accessibilityValue
  const [accNow, setAccNow] = useState(Math.round(clamp(value) * 100));
  useEffect(() => {
    const id = progress.addListener(({value: v}) => {
      setAccNow(Math.round(clamp(v) * 100));
    });
    return () => progress.removeListener(id);
  }, []);

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const {actionName} = e.nativeEvent;
    if (actionName === 'increment') {
      setFromValue(clamp(value + STEP), true);
    } else if (actionName === 'decrement') {
      setFromValue(clamp(value - STEP), true);
    }
  };

  return (
    <View
      {...pan.panHandlers}
      onLayout={onLayout}
      style={[styles.container, {height}]}
      pointerEvents="box-only"
      hitSlop={{left: 8, right: 8, top: 8, bottom: 8}}

      // Acessibilidade do slider
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Ajuste o volume deslizando ou usando gestos do leitor de tela"
      accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
      onAccessibilityAction={onAccessibilityAction}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: accNow,
        text: `Volume ${accNow} por cento`
      }}
    >
      <View style={[styles.track, {height: trackHeight, backgroundColor: inactiveColor}]} />
      <Animated.View style={[styles.trackActive, {height: trackHeight, backgroundColor: activeColor, width: activeWidth}]} />
      <Animated.View
        style={[
          styles.thumb,
          {width: thumbSize, height: thumbSize, borderRadius: thumbSize, backgroundColor: activeColor, transform: [{translateX: thumbTranslateX}]}
        ]}
        // O “polegar” é visual apenas (não precisa foco separado)
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {width: '100%', justifyContent: 'center'},
  track: {width: '100%', borderRadius: 999},
  trackActive: {position: 'absolute', left: 0, borderRadius: 999},
  thumb: {position: 'absolute', left: 0, top: '50%', marginTop: -10, elevation: 2}
});
