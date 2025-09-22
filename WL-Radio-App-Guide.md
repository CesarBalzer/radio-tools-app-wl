
# Guia do App de Rádio **White Label (WL)**

> Versão do documento: 2025-09-22

Este guia explica como **configurar**, **operar**, **marcar** (branding) e **publicar** o aplicativo de rádio *white label*.
Inclui um **esquema de configuração**, fluxo de metadados de “Now Playing”, integração de *cover art*, banners/patrocínios, recursos
opcionais e um checklist de build/distribuição.

---

## 1) Visão Geral

O app WL é um **container rebrandável**: um único código que lê uma **configuração hospedada na CDN** para
customizar identidade visual, fontes de áudio/vídeo, imagens, parceiros/promoções e flags de recursos.

**Pontos‑chave**

- **Sem recompile** para ajustes do cliente: você publica um JSON na CDN e o app **sincroniza** periodicamente (`features.checkConfigIntervalSec`).
- **Áudio ao vivo** com _fallbacks_ de endpoints e _share_ pronto.
- **Now Playing robusto**: pega metadados do player quando disponíveis **e** faz *polling* de `status-json.xsl`/endpoint customizado.
- **UI WL**: TopBar com **MiniMarquee** para o título longo, exibe artista/álbum e capa do disco quando disponível.
- **Branding completo**: cores, logotipo, imagem de fundo, status bar e modo de navegação.
- **Banners/Patrocinadores** e **Promos** com CTA.
- **Video/HLS** opcional.
- **Features flags** para habilitar PiP, mini player, etc.

---

## 2) Estrutura da Configuração (CDN)

### Exemplo (copie e ajuste por cliente)

```json
{{
  "version": 2,
  "branding": {{
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
  }},
  "streams": {{
    "radio": {{
      "primaryUrl": "https://str1.streamhostpg.com.br:8042/stream",
      "fallbackUrls": ["https://backup.exemplo.com/aurora.mp3"],
      "metadataUrl": "https://api.exemplo.com/aurora/now-playing"
    }},
    "video": {{
      "primaryUrl": "https://s1.tvr.ovh/tropicalfm/tropicalfm/playlist.m3u8",
      "fallbackUrls": []
    }}
  }},
  "station": {{
    "name": "Aurora FM",
    "genre": "Pop/EDM",
    "logoUrl": "https://placehold.co/150x150/7C3AED/FFFFFF.png?text=Aurora",
    "shareUrl": "https://kdsistemasweb.com.br/aurora",
    "partners": [
      {{
        "imageUrl": "https://placehold.co/300x100/4C1D95/FFFFFF.png?text=Patrocinador+Alpha",
        "title": "Alpha",
        "href": "https://a.com"
      }},
      {{
        "imageUrl": "https://placehold.co/300x100/6D28D9/FFFFFF.png?text=Patrocinador+Beta",
        "title": "Beta",
        "href": "https://b.com"
      }}
    ],
    "heroImages": [
      "https://placehold.co/1200x1200/333/FFFFFF.png?text=Banner+Radio+1",
      "https://placehold.co/1200x600/222/FFFFFF.png?text=Banner+Radio+2"
    ]
  }},
  "promos": {{
    "headline": "Cupons Aurora",
    "items": [
      {{
        "id": "aur-10",
        "title": "10% OFF Aurora Store",
        "image": "https://placehold.co/400x200/7C3AED/FFFFFF.png?text=Cupom+Aurora",
        "code": "AUR10",
        "rulesUrl": "https://placehold.co/200x100/1E1B4B/FFFFFF.png?text=Regras",
        "expiresAt": "2025-10-10"
      }}
    ]
  }},
  "features": {{
    "enablePictureInPicture": true,
    "enableMiniPlayer": true,
    "checkConfigIntervalSec": 900
  }}
}}
```

### Referência rápida

- `version` — versão do schema do JSON.
- `branding` — cores, logo, fundo, status bar e navegação.
- `streams.radio.primaryUrl` — URL principal do stream (pode ser AAC/MP3).
- `streams.radio.fallbackUrls` — lista de URLs alternativas (tentadas em cascata).
- `streams.radio.metadataUrl` — endpoint opcional para “now playing”. Se ausente, o app tenta derivar `status-json.xsl` do host do stream.
- `streams.video.*` — opcional (HLS `.m3u8`).
- `station` — nome, gênero, logo, `shareUrl`, parceiros e *hero images*.
- `promos` — vitrine de cupons (headline, itens, validade).
- `features` — flags e intervalo de rechecagem da configuração (em segundos).

**Boas práticas de CDN**

- Sirva com **HTTPS** + **CORS: \***.
- Defina `Cache-Control: max-age=60` (ou similar). O app respeita `checkConfigIntervalSec` para *refresh*.
- Publique os assets (logo, fundos, banners) em URLs estáveis.

---

## 3) Player e Fallbacks

- O app usa `react-native-track-player` (RNTP) e implementa:
  - **fila vazia → play** no primeiro endpoint que responder (dentro de um *timeout*), senão tenta *fallbacks*;
  - **togglePlay** pausa/retoma; **share** monta mensagem com rádio + link;
  - **volume** controlado via RNTP.
- Estados e eventos monitorados: `PlaybackState`, `PlaybackActiveTrackChanged`, `PlaybackError`, `PlaybackProgressUpdated`.

**Dica de compatibilidade**  
Em iOS, streams **AAC** podem tocar normalmente, mas **não expor metadados ICY** via AVPlayer. Se precisar de metadados “pelo player”, priorize um **mount MP3**; de todo modo o app cobre via *polling* (abaixo).

---

## 4) Now Playing (Metadados)

O hook `useNowPlaying` trabalha em **duas camadas**:

1. **Eventos do player** — quando o stream/mount e a plataforma expõem metadados (`Event.MetadataCommonReceived`).
2. **Polling** — a cada 5–12s, consulta na ordem:
   - `streams.radio.metadataUrl` (se fornecido)
   - `https://<host:porta>/status-json.xsl`
   - `https://<host:porta>/status.xsl` (HTML; extrai `StreamTitle`)

O parser entende formatos comuns (Icecast/SHOUTcast), faz *split* de `"Artista - Música"` e reseta o cronômetro da faixa quando detecta mudança.

**Capa (cover art)**  
`useCoverArt(artist, title)` tenta buscar a capa por heurística (ex.: fornecedores públicos/abertos, se habilitado). Se não encontrar, exibe o logo da rádio.

**TopBar**  
- Título da faixa.
- À direita, `artista · álbum` (se disponível).
- Fallback: exibe `station.genre` quando não há metadados.

---

## 5) Branding e UI

- **Cores**: `branding.primary`, `background`, `text`, `border`, `card`, `muted`.
- **Logo**: `branding.logoUrl` (TopBar/Share quando não houver capa).
- **Background**: `branding.bgImageUrl` + `station.heroImages` alimentam o `BackgroundHero`.
- **Status bar**: `branding.statusBarStyle` (`light` | `dark`).
- **Navigation**: `branding.navigationMode` (`light` | `dark`).

**Banners/Parceiros**  
`station.partners` com `imageUrl`, `title`, `href` → mostrado no carrossel de *partners* (CTA opcional).

**Promos**  
Secção opcional com `headline` e `items` (id, título, imagem, código, regras, validade).

---

## 6) Compartilhamento (Share)

O TopBar envia `onShare(payload)` com `{ name, artist?, title?, album?, logoUrl?, coverUrl? }`.
No `PlayerScreen`, o app monta a mensagem com:

- `🎵 Tocando agora: <Artista> — <Música>` (se houver)
- `📻 Rádio: <Nome>`
- `▶️ Ouça: <station.shareUrl || currentUrl>`
- `🖼️ Capa: <coverUrl>` (opcional)

Você pode customizar o template por cliente.

---

## 7) Features Flags

- `enablePictureInPicture` — se o player suporta PiP na plataforma.
- `enableMiniPlayer` — ativa mini player persistente.
- `checkConfigIntervalSec` — revalida a configuração via CDN a cada *n* segundos.

---

## 8) Publicação (Android)

### EAS Build (recomendado)
- `eas build -p android --profile preview` → **APK** para testes internos
- `eas build -p android --profile production` → **AAB** para Play Store

Checklist Play Store: `versionCode` incrementado, *app icon*, *splash*, permissões (internet/áudio), **política de privacidade** (link), *content rating*, *store listing* e *screenshots*.

### Gradle local (prebuild)
- `./gradlew assembleRelease` → APK assinada (`app-release.apk`)
- `./gradlew bundleRelease` → AAB (`app-release.aab`)

Assinatura **release** com keystore (upload/signing).

---

## 9) Troubleshooting

- **Toca mas não mostra Now Playing**  
  - Verifique se o mount é **AAC** em iOS (sem ICY). Use **MP3** quando possível ou garanta `metadataUrl`/`status-json.xsl`.
- **CORS no metadataUrl**  
  - Habilite `Access-Control-Allow-Origin: *` no endpoint.
- **CDN sem atualização**  
  - Cheque cabeçalhos de cache e o `checkConfigIntervalSec`.
- **Share sem link**  
  - Configure `station.shareUrl`; caso ausente, o app usa `currentUrl` do player.
- **Layout não rola título**  
  - Verifique medidas do `MiniMarquee` (container precisa de `width: '100%'`, `minWidth: 0`).

---

## 10) Tipos (TypeScript)

```ts
export type WLConfig = {{
  version: number;
  branding: {{
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
  }};
  streams: {{
    radio: {{
      primaryUrl: string;
      fallbackUrls?: string[];
      metadataUrl?: string;
    }};
    video?: {{
      primaryUrl: string;
      fallbackUrls?: string[];
    }};
  }};
  station: {{
    name: string;
    genre?: string;
    logoUrl?: string;
    shareUrl?: string;
    partners?: Array<{{ imageUrl: string; title?: string; href?: string } }>;
    heroImages?: string[];
  }};
  promos?: {{
    headline?: string;
    items?: Array<{{
      id: string;
      title: string;
      image?: string;
      code?: string;
      rulesUrl?: string;
      expiresAt?: string; // ISO date
    } }>;
  }};
  features?: {{
    enablePictureInPicture?: boolean;
    enableMiniPlayer?: boolean;
    checkConfigIntervalSec?: number;
  }};
}};
```

---

## 11) Passo‑a‑passo para um novo cliente (resumo)

1. **Clone** o JSON de exemplo, ajuste `branding`, `streams`, `station`, `promos`, `features`.
2. **Publique** esse JSON na CDN (HTTPS + CORS).
3. **Configure** no painel (ou arquivo) do WL o **endpoint da config** desse cliente.
4. **Teste**: abra o app → confira cores, logotipo, banners e se o áudio toca; verifique *Now Playing*.
5. **Share**: valide a mensagem com os metadados.
6. **Build** (APK/AAB) e **distribua** conforme o canal (interno/loja).

---

## 12) Segurança e Privacidade

- O app não coleta dados pessoais por padrão.
- Certifique a **proveniência** de endpoints de metadata/capas e sua conformidade de uso.
- Publique a **Política de Privacidade** no site do cliente e referencie na loja.

---

**FIM** — dúvidas ou ajustes de schema, entre em contato com a equipe responsável pelo WL.
