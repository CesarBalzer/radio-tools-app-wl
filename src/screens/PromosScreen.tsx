import React from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { useRemoteConfig } from '../config/RemoteConfigProvider';
import { useTheme } from '../theme/ThemeProvider';

export default function PromosScreen() {
  const { promos } = useRemoteConfig();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>{promos.headline ?? 'Promoções'}</Text>
      <FlatList
        data={promos.items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: theme.primary }]}>
            {item.image ? <Image source={{ uri: item.image }} style={styles.img} /> : null}
            <View style={{ padding: 12 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
              {item.code ? <Text style={{ color: theme.text, opacity: 0.8 }}>Cupom: {item.code}</Text> : null}
              {item.expiresAt ? <Text style={{ color: theme.text, opacity: 0.6 }}>Validade: {item.expiresAt}</Text> : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '600', padding: 16 },
  card: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  img: { width: '100%', height: 160, backgroundColor: '#111' },
  code: { fontWeight: '700' }
});
