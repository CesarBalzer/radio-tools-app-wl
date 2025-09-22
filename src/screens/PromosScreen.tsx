// src/screens/PromosScreen.tsx
import React, {useMemo} from 'react';
import {View, Text, FlatList, Image, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRemoteConfig} from '../config/RemoteConfigProvider';
import {useTheme, type Theme} from '../theme/ThemeProvider';

function withAlpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const to255 = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
  const r = to255(h.length === 3 ? h[0] : h.slice(0, 2));
  const g = to255(h.length === 3 ? h[1] : h.slice(2, 4));
  const b = to255(h.length === 3 ? h[2] : h.slice(4, 6));
  return `rgba(${r},${g},${b},${a})`;
}

export default function PromosScreen() {
  const {promos} = useRemoteConfig();
  const theme = useTheme();
  const s = styles(theme);
  const items = useMemo(() => promos?.items ?? [], [promos?.items]);

  return (
    <SafeAreaView edges={['top']} style={[s.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[s.title, {color: theme.colors.text}]}>{promos?.headline ?? 'Promoções'}</Text>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyTxt, {color: theme.colors.text}]}>Nenhuma promoção disponível.</Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={[s.card, {backgroundColor: withAlpha(theme.colors.primary, 0.2), borderColor: theme.colors.border}]}>
            {item.image ? <Image source={{uri: item.image}} style={s.img} /> : null}
            <View style={s.body}>
              <Text style={[s.cardTitle, {color: theme.colors.text}]} numberOfLines={2}>{item.title}</Text>
              {item.code ? (
                <View style={[s.badge, {backgroundColor: withAlpha(theme.colors.primary, 0.18), borderColor: theme.colors.border}]}>
                  <Text style={[s.badgeTxt, {color: theme.colors.text}]}>Cupom: {item.code}</Text>
                </View>
              ) : null}
              {item.expiresAt ? (
                <Text style={[s.meta, {color: theme.colors.text}]}>Validade: {item.expiresAt}</Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function styles(t: Theme) {
  return StyleSheet.create({
    container: {flex: 1},
    title: {fontSize: 24, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},
    list: {paddingHorizontal: 12, paddingBottom: 16, gap: 12},
    empty: {padding: 20, alignItems: 'center', justifyContent: 'center'},
    emptyTxt: {opacity: 0.7},
    card: {borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, overflow: 'hidden'},
    img: {width: '100%', height: 160, backgroundColor: '#111'},
    body: {padding: 12, gap: 6},
    cardTitle: {fontSize: 16, fontWeight: '700'},
    badge: {alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth},
    badgeTxt: {fontSize: 12, fontWeight: '800', letterSpacing: 0.3},
    meta: {fontSize: 12, opacity: 0.7}
  });
}
