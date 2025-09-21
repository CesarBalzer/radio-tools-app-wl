import TrackPlayer from 'react-native-track-player';

export async function playStream(label: string, url: string) {
  await TrackPlayer.reset();
  await TrackPlayer.add({
    id: 'radio-stream',
    url,
    title: 'Rádio Ao Vivo',
    artist: label,
    artwork: undefined
  });
  await TrackPlayer.play();
}
