// src/screens/player/components/TrackModal.tsx
import React, {useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import type {ItunesTrack} from '../hooks/useItunesTrack';
import {Ionicons} from '@expo/vector-icons';
import {onColorFor, rgbaFromHex, withAlpha} from '../utils/format';

type Props = {
  visible: boolean;
  onClose: () => void;
  track: ItunesTrack | null;
};

function upscaleItunesArt(url?: string | null) {
  if (!url) return undefined;
  return url.replace(/\/\d+x\d+bb\.(?:jpg|png)/, '/600x600bb.jpg');
}

export default function TrackModal({visible, onClose, track}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // ❗️chame todos hooks antes dos returns condicionais
  if (!visible || !track) return null;

  const cover = upscaleItunesArt(track.artworkUrl100);
  const released = track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : null;

  const openAppleMusic = async () => {
    if (!track.trackViewUrl) return;
    try {
      await Linking.openURL(track.trackViewUrl);
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* backdrop com cor primária do tenant + alpha */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* handle opcional */}
        <View style={styles.handle} />

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {cover ? <Image source={{uri: cover}} style={styles.cover} /> : null}

          <Text style={styles.title} numberOfLines={3}>
            {track.trackName}
          </Text>

          <Text style={styles.artist} numberOfLines={2}>
            {track.artistName}
          </Text>

          {!!track.collectionName && (
            <Text style={styles.subtle} numberOfLines={2}>
              Álbum: <Text style={styles.em}>{track.collectionName}</Text>
            </Text>
          )}

          {!!track.primaryGenreName && (
            <Text style={[styles.subtle, styles.italic]}>{track.primaryGenreName}</Text>
          )}

          {!!released && <Text style={styles.meta}>Lançamento: {released}</Text>}

          {/* Botão Apple Music (deixe habilitado se quiser) */}
          {/* {!!track.trackViewUrl && (
            <TouchableOpacity style={styles.primaryBtn} onPress={openAppleMusic}>
              <Ionicons name="musical-notes" size={18} color={styles._onPrimary} />
              <Text style={[styles.primaryBtnText, { color: styles._onPrimary }]}>
                Abrir no Apple Music
              </Text>
            </TouchableOpacity>
          )} */}

          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={theme.colors.text} />
            <Text style={styles.secondaryBtnText}>Fechar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const {colors} = theme;
  const onPrimary = onColorFor(colors.primary, '#000');

  return StyleSheet.create({
    // expo-stylesheet não guarda valores arbitrários, então
    // se precisar do valor em runtime (ex.: cor do texto do botão primário),
    // exponho como propriedade read-only no objeto retornado:
    _onPrimary: onPrimary as any,

    backdrop: {
      flex: 1,
      // overlay com a cor do tenant
      backgroundColor: rgbaFromHex(colors.primary, 0.82),
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 50,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: withAlpha(colors.primary, 0.25), // sutilmente ligado ao tenant
      paddingBottom: 12,
      ...Platform.select({
        ios: {shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: {width: 0, height: -4}},
        android: {elevation: 16},
      }),
      maxHeight: '88%',
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: rgbaFromHex(colors.primary, 0.4),
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 6,
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 24,
      gap: 8,
    },
    cover: {
      width: 240,
      height: 240,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      marginTop: 12,
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    artist: {
      marginTop: 4,
      fontSize: 16,
      fontWeight: '600',
      color: colors.muted,
      textAlign: 'center',
    },
    subtle: {
      marginTop: 6,
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
    },
    italic: {fontStyle: 'italic'},
    em: {color: colors.text, fontWeight: '600'},
    meta: {
      marginTop: 2,
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
    },
    primaryBtn: {
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      alignSelf: 'stretch',
      justifyContent: 'center',
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryBtn: {
      marginTop: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'stretch',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  });
}
