/* ─────────── Tipagens ─────────── */
export type Branding = {
	/** cor de destaque (botões, tabs ativas, etc.) */
	primary?: string;
	/** cor de fundo principal do app */
	background?: string;
	/** cor de texto principal */
	text?: string;

	/** assets */
	logoUrl?: string;
	bgImageUrl?: string;

	/** controles explícitos do cliente */
	statusBarStyle?: 'light' | 'dark'; // default: 'light'
	navigationMode?: 'light' | 'dark'; // default: 'dark'

	/** overrides opcionais para tema (caso o cliente queira controle total) */
	muted?: string;
	border?: string;
	card?: string;
};

export type StreamsGroup = {
	primaryUrl: string;
	fallbackUrls?: string[];
	metadataUrl?: string;
};

export type StationPartner = {imageUrl: string; title?: string; href?: string};

export type Station = {
	name?: string;
	genre?: string;
	logoUrl?: string;
	shareUrl?: string;
	partners?: StationPartner[];

	/** imagens grandes para heros/carrosséis da home */
	heroImages?: string[];
};

export type PromoItem = {
	id: string;
	title: string;
	image?: string;
	code?: string;
	rulesUrl?: string;
	expiresAt?: string; // ISO-8601
};

export type RemoteConfig = {
	version: number;

	branding: Branding;

	streams: {
		radio: StreamsGroup;
		video?: StreamsGroup;
	};

	station?: Station;

	promos?: {
		headline?: string;
		items?: PromoItem[];
	};

	features?: {
		enablePictureInPicture?: boolean;
		enableMiniPlayer?: boolean;
		checkConfigIntervalSec?: number;
	};
};

export type ShareProps = {
	name: string;
	genre: string;
	logoUrl?: string;
	onShare?: (payload: {name: string; artist?: string; title?: string; logoUrl?: string; coverUrl?: string | null}) => void;
	artist?: string;
	title?: string;
};
