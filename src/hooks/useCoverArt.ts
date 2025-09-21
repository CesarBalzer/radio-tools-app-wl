// src/screens/player/hooks/useCoverArt.ts
import {useEffect, useState} from 'react';
import axios from 'axios';

/**
 * Busca a capa do álbum (cover art) no iTunes Search API.
 * Se não encontrar, retorna null.
 */
export function useCoverArt(artist?: string, title?: string) {
	const [artUrl, setArtUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!artist && !title) return;

		const q = encodeURIComponent(`${artist ?? ''} ${title ?? ''}`);
		const controller = new AbortController();

		axios
			.get(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`, {
				signal: controller.signal,
				timeout: 6000
			})
			.then((res) => {
				const item = res.data?.results?.[0];
				if (item?.artworkUrl100) {
					// melhora resolução: 100x100 → 600x600
					setArtUrl(item.artworkUrl100.replace('100x100', '600x600'));
				} else {
					setArtUrl(null);
				}
			})
			.catch(() => setArtUrl(null));

		return () => {
			controller.abort();
		};
	}, [artist, title]);

	return artUrl;
}
