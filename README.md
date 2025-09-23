# Guia do App de Rádio **White Label (WL)**

> **Versão do documento:** 2025-09-22  
> **Novidade:** o app WL agora oferece recursos de **Acessibilidade** (VoiceOver/TalkBack, Closed Captions quando disponíveis, leitura de estados do player, controles navegáveis e escaláveis).

Este guia explica como **configurar**, **operar**, **marcar** (branding) e **publicar** o aplicativo de rádio *white label*.  
Inclui **esquema de configuração**, fluxo de metadados de “Now Playing”, integração de capas (*cover art*), banners/patrocínios, recursos opcionais, **acessibilidade** e um checklist de build/distribuição.

---

## 1) Visão Geral

O app WL é um **container rebrandável**: um único código que lê uma **configuração hospedada na CDN** para customizar identidade visual, fontes de áudio/vídeo, imagens, parceiros/promoções e *feature flags*.

**Pontos‑chave**

- **Sem recompile** para ajustes do cliente: publique um JSON na CDN e o app **sincroniza** periodicamente (`features.checkConfigIntervalSec`).
- **Áudio ao vivo** com *fallbacks* de endpoints e *share* pronto.
- **Now Playing robusto**: combina metadados emitidos pelo player com *polling* de `status-json.xsl`/endpoint customizado.
- **UI WL**: TopBar exibe artista/título, capa quando disponível e ações de *share* / detalhes (TrackModal).
- **Branding completo**: cores, logotipo, imagem de fundo, status bar e modo de navegação.
- **Banners/Patrocinadores** e **Promos** com CTA.
- **Vídeo/HLS** opcional via **expo-video**.
- **Acessibilidade integrada** (detalhes na seção 7).

---

## 2) Estrutura da Configuração (CDN)

### Exemplo (copie e ajuste por cliente)

```json
{
  "version": 2,
  "branding": {
    "primary": "#7C3AED",
    "background": "#0B0A10",
    "text": "#FFFFFF",
    "logoUrl": "https://placehold.co/200x60/7C3AED/FFFFFF.png?text=Aurora+FM",
    "bgImageUrl": "https://placehold.co/1200x800/1E1B4B/FFFFFF.png?text=Background+Aurora",
    "statusBarStyle": "light",
    "navigationMode": "dark",
    "muted": "#A3A3A3",
    "border": "rgba(255,255,255,0.12)",
    "card": "#111111"
  },
  "streams": {
    "radio": {
      "primaryUrl": "https://mystreamserver.com.br:8042/stream",
      "fallbackUrls": ["https://backup.exemplo.com/aurora.mp3"],
      "metadataUrl": "https://api.exemplo.com/aurora/now-playing"
    },
    "video": {
      "primaryUrl": "https://s1.tvr.ovh/tropicalfm/tropicalfm/playlist.m3u8",
      "fallbackUrls": []
    }
  },
  "station": {
    "name": "Aurora FM",
    "genre": "Pop/EDM",
    "logoUrl": "https://placehold.co/150x150/7C3AED/FFFFFF.png?text=Aurora",
    "shareUrl": "https://kdsistemasweb.com.br/aurora",
    "partners": [
      {
        "imageUrl": "https://placehold.co/300x100/4C1D95/FFFFFF.png?text=Patrocinador+Alpha",
        "title": "Alpha",
        "href": "https://a.com"
      },
      {
        "imageUrl": "https://placehold.co/300x100/6D28D9/FFFFFF.png?text=Patrocinador+Beta",
        "title": "Beta",
        "href": "https://b.com"
      }
    ],
    "heroImages": [
      "https://placehold.co/1200x1200/333/FFFFFF.png?text=Banner+Radio+1",
      "https://placehold.co/1200x600/222/FFFFFF.png?text=Banner+Radio+2"
    ]
  },
  "promos": {
    "headline": "Cupons Aurora",
    "items": [
      {
        "id": "aur-10",
        "title": "10% OFF Aurora Store",
        "image": "https://placehold.co/400x200/7C3AED/FFFFFF.png?text=Cupom+Aurora",
        "code": "AUR10",
        "rulesUrl": "https://placehold.co/200x100/1E1B4B/FFFFFF.png?text=Regras",
        "expiresAt": "2025-10-10"
      }
    ]
  },
  "features": {
    "enablePictureInPicture": true,
    "enableMiniPlayer": true,
    "checkConfigIntervalSec": 900
  }
}
```

### Referência rápida

- `version` — versão do schema do JSON.
- `branding` — cores, logo, fundo, status bar e navegação.
- `streams.radio.primaryUrl` — URL principal do stream (AAC/MP3).
- `streams.radio.fallbackUrls` — URLs alternativas (tentadas em cascata).
- `streams.radio.metadataUrl` — endpoint opcional para “now playing”. Se ausente, o app tenta `status-json.xsl` do host do stream.
- `streams.video.*` — opcional (HLS `.m3u8`) usado pelo **LiveScreen** via **expo-video**.
- `station` — nome, gênero, logo, `shareUrl`, parceiros e *hero images*.
- `promos` — vitrine de cupons (headline, itens, validade).
- `features` — flags e intervalo de rechecagem da configuração (em segundos).

**Boas práticas de CDN**
- HTTPS + CORS (`Access-Control-Allow-Origin: *`).
- `Cache-Control: max-age=60` (ou similar). O app respeita `checkConfigIntervalSec` para *refresh*.
- Assets (logo/fundos/banners) em URLs estáveis.

---

## 3) Player de Áudio (Rádio) e Fallbacks

O player tenta a **`primaryUrl`** e, em caso de falha, percorre **`fallbackUrls`**. A tela expõe **Play/Pause**, **Volume** e **Share**.

**Compatibilidade (dica prática)**  
Em iOS, streams **AAC** tocam normalmente, mas muitas vezes **não expõem metadados ICY** via AVPlayer. Se precisar de metadados vindos do próprio stream, prefira um **mount MP3**; de qualquer modo, o app cobre via *polling* (abaixo).

---

## 4) Now Playing (Metadados)

O hook `useNowPlaying` trabalha em **duas camadas**:

1. **Eventos do player** — quando o stream/plataforma expõe metadados (ICY/Shoutcast/Icecast).
2. **Polling** — a cada 5–12s, consulta na ordem:
   - `streams.radio.metadataUrl` (se fornecido)
   - `https://<host:porta>/status-json.xsl`
   - `https://<host:porta>/status.xsl` (HTML; extrai `StreamTitle`)

O parser entende formatos comuns, faz *split* de `"Artista - Música"` e reinicia o cronômetro quando detecta mudança.

**Capa (cover art)**  
`useCoverArt(artist, title)` tenta capa por heurística. Sem capa, o app usa o **logo da rádio**.

**TopBar**  
- Exibe **Artista — Título** (ou `station.genre` como fallback).
- Ação de **compartilhar** e **detalhes** (TrackModal).

---

## 5) Branding e UI

- **Cores**: `branding.primary`, `background`, `text`, `border`, `card`, `muted`.
- **Logo**: `branding.logoUrl` (TopBar/Share).
- **Background**: `branding.bgImageUrl` + `station.heroImages` (BackgroundHero).
- **Status bar**: `branding.statusBarStyle` (`light` | `dark`).
- **Navigation**: `branding.navigationMode` (`light` | `dark`).

**Banners/Parceiros**  
`station.partners` com `imageUrl`, `title`, `href` aparecem no carrossel de parceiros.

**Promos**  
Seção opcional com `headline` e `items` (id, título, imagem, código, regras, validade).

---

## 6) Vídeo (LiveScreen)

O LiveScreen usa **expo-video** (`VideoView` + `useVideoPlayer`) com:

- **`streams.video.primaryUrl`** (HLS) e `fallbackUrls` (se aplicável).
- **Controles nativos** (`nativeControls`), **fullscreen** e **Picture-in-Picture** (quando suportado).
- **Closed Captions** quando a **trilha HLS já inclui legendas** (o player detecta faixas e permite alternância).
- Sem “fallbacks externos” automáticos: se a URL não existir no JSON, a tela informa **“Sem canal de vídeo configurado.”**

---

## 7) Acessibilidade (iOS + Android)

Recursos implementados:

- **Leitores de tela (VoiceOver/TalkBack)**:
  - Labels/roles/hints em botões principais (Play/Pause, Share, Info).
  - **Anúncios de estado**: “Conectando…”, erros do player, “Agora tocando…”.
  - Ordem de foco previsível (imagens decorativas são ignoradas).
- **Texto dinâmico**: `allowFontScaling` nos textos; alvos de toque ≥ **44x44**.
- **Volume acessível**: slider com `role="adjustable"`, `increment/decrement` e **porcentagem lida**.
- **TrackModal**: abre como **modal acessível**, foca o título, permite **“acessibility escape”** (iOS) e tem link de música com role **link**.
- **LiveScreen**: player com *labels* e hints; **CC** quando disponíveis no HLS; fullscreen/PiP com rótulos.
- **BannerCarousel**: pausa autoplay com leitor de tela ou interação; banners viram **links** quando têm `href`; dots são **botões** focáveis com estado `selected`.

### Como testar (rápido)
- **iOS (Simulator)**: Ative **VoiceOver** (Settings → Accessibility) e navegue por foco; aumente texto em *Larger Text*.
- **Android (device real)**: Ative **TalkBack** (Acessibilidade) e explore por toque; use o **Accessibility Scanner** do Google para um *pass* rápido.

---

## 8) Compartilhamento (Share)

A mensagem inclui (quando disponível):

- `🎵 Tocando agora: <Artista> — <Música>`
- `📻 Rádio: <Nome>`
- `▶️ Ouça: <station.shareUrl || currentUrl>`

---

## 9) Features Flags

- `enablePictureInPicture` — habilita PiP, conforme suporte da plataforma.
- `enableMiniPlayer` — ativa **mini player** (se implementado no projeto).
- `checkConfigIntervalSec` — revalida a configuração via CDN a cada *n* segundos.

---

## 10) Publicação (Android)

### EAS Build (recomendado)
- `eas build -p android --profile preview` → **APK** para testes internos
- `eas build -p android --profile production` → **AAB** para Play Store

Checklist Play Store: `versionCode` incrementado, *app icon*, *splash*, permissões (internet/áudio), **política de privacidade** (link), *content rating*, *store listing* e *screenshots*.

### Gradle local (prebuild)
- `./gradlew assembleRelease` → APK assinada (`app-release.apk`)
- `./gradlew bundleRelease` → AAB (`app-release.aab`)

---

## 11) Troubleshooting

- **Toca mas não mostra Now Playing**
  - AAC no iOS pode não expor ICY; preferir MP3 ou configurar `metadataUrl`/`status-json.xsl`.
- **CORS no metadataUrl**
  - Habilite `Access-Control-Allow-Origin: *` no endpoint.
- **CDN sem atualização**
  - Revise cabeçalhos de cache e `checkConfigIntervalSec`.
- **Share sem link**
  - Configure `station.shareUrl`; caso ausente, o app usa `currentUrl`.
- **Vídeo sem legenda**
  - Legendas dependem de faixas no **próprio HLS**; sem faixas, o app não inventa CC.

---

## 12) Tipos (TypeScript)

```ts
export type WLConfig = {
  version: number;
  branding: {
    primary: string;
    background: string;
    text: string;
    logoUrl?: string;
    bgImageUrl?: string;
    statusBarStyle?: 'light' | 'dark';
    navigationMode?: 'light' | 'dark';
    muted?: string;
    border?: string;
    card?: string;
  };
  streams: {
    radio: {
      primaryUrl: string;
      fallbackUrls?: string[];
      metadataUrl?: string;
    };
    video?: {
      primaryUrl: string;
      fallbackUrls?: string[];
    };
  };
  station: {
    name: string;
    genre?: string;
    logoUrl?: string;
    shareUrl?: string;
    partners?: Array<{ imageUrl: string; title?: string; href?: string }>;
    heroImages?: string[];
  };
  promos?: {
    headline?: string;
    items?: Array<{
      id: string;
      title: string;
      image?: string;
      code?: string;
      rulesUrl?: string;
      expiresAt?: string; // ISO date
    }>;
  };
  features?: {
    enablePictureInPicture?: boolean;
    enableMiniPlayer?: boolean;
    checkConfigIntervalSec?: number;
  };
};
```

---

## 13) Passo‑a‑passo para um novo cliente (resumo)

1. **Clone** o JSON de exemplo e ajuste `branding`, `streams`, `station`, `promos`, `features`.
2. **Publique** o JSON na CDN (HTTPS + CORS).
3. **Configure** no WL o **endpoint da config** do cliente.
4. **Teste**: cores, logotipo, banners, áudio e *Now Playing*.
5. **Share**: valide a mensagem com metadados.
6. **Build** (APK/AAB) e **distribua** conforme o canal (interno/loja).

---

## 14) Segurança e Privacidade

- O app não coleta dados pessoais por padrão.
- Garanta a **proveniência** de endpoints de metadata/capas e conformidade de uso.
- Publique a **Política de Privacidade** no site do cliente e referencie na loja.

---

**FIM** — dúvidas ou ajustes de schema, fale com a equipe do WL.
