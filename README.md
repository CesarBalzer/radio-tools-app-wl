# Guia do App de Rádio White Label (WL)

**Versão do documento:** 2026-01-17

Este documento descreve como configurar, operar, personalizar (branding) e publicar o aplicativo de rádio **White Label (WL)**.  
O app é um container rebrandável que lê uma configuração remota (JSON) hospedada em CDN/servidor e sincroniza periodicamente essas informações.

---

## 1) Visão Geral

O app WL utiliza um único código-base e aplica identidade visual, streams e conteúdo a partir de uma configuração remota.

**Principais características**

- Atualização de configuração sem nova publicação na loja (para mudanças de conteúdo/branding).
- Revalidação periódica da config via `features.checkConfigIntervalSec` enquanto o app estiver ativo.
- Refresh automático ao retornar do background.
- Player de áudio ao vivo com fallback automático de streams.
- Now Playing robusto (eventos do player + polling HTTP).
- Vídeo opcional via HLS (expo-video).
- Recursos de acessibilidade integrados (iOS e Android).

---

## 2) Estrutura da Configuração (JSON)

Exemplo completo de configuração por cliente:

```json
{
	"version": 2,
	"branding": {
		"primary": "#7C3AED", //cor padrao destaque
		"background": "#0B0A10", //cor de fundo das telas
		"text": "#FFFFFF", // cor da letra
		"logoUrl": "https://placehold.co/200x60/7C3AED/FFFFFF.png?text=Aurora+FM", //segundo splash
		"bgImageUrl": "https://placehold.co/1200x800/1E1B4B/FFFFFF.png?text=Background+Aurora", //segundo splash
		"statusBarStyle": "light", //barra superior da hora - dark/light
		"navigationMode": "dark", //automatico somente para android
		"muted": "#A3A3A3", //cor menos chamativa para textos auxiliares
		"border": "rgba(255,255,255,0.12)", //cor da borda padrao dos botoes
		"card": "#111111" //cor de fundo dos cards
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
			}
		],
		"heroImages": ["https://placehold.co/1200x1200/333/FFFFFF.png?text=Banner+Radio+1"]
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

**Notas importantes**

- `checkConfigIntervalSec = 900` equivale a **15 minutos**.
- Recomenda-se CDN com HTTPS, CORS liberado e suporte a `ETag`.
- O app utiliza cache local (AsyncStorage) para inicialização rápida e resiliência.

---

## 3) Atualização Automática da Configuração

- O app revalida a configuração no intervalo definido em `checkConfigIntervalSec` enquanto estiver em foreground.
- Ao retornar do background, um refresh imediato é executado.
- Em caso de erro de rede ou servidor indisponível, o app continua funcionando com a última configuração válida em cache.

---

## 4) Player de Áudio (Rádio) e Fallbacks

- O player tenta iniciar pela `streams.radio.primaryUrl`.
- Caso não entre em estado **Playing** dentro do timeout, tenta cada URL em `fallbackUrls`.
- Se todas falharem, o app exibe erro e não inicia o áudio.

---

## 5) Now Playing (Metadados)

O Now Playing opera em duas camadas:

1. **Eventos do player**
   - Metadados nativos (`MetadataCommonReceived`) quando disponíveis.

2. **Polling HTTP (a cada 5 segundos, enquanto tocando)**
   - Ordem de consulta:
     1. `streams.radio.metadataUrl` (se configurado)
     2. `<base>/status-json.xsl`
     3. `<base>/status.xsl`
   - Parser automático extrai `StreamTitle` e divide no formato `Artista - Música`.

---

## 6) Capa (Cover Art)

- Quando `artist` e/ou `title` estão disponíveis, o app pode buscar capas via **iTunes Search API**.
- A busca retorna a melhor correspondência e normaliza a imagem para alta resolução.
- Em caso de erro ou ausência de resultados, a UI utiliza o logo/branding da rádio como fallback.
- Este recurso depende de serviço de terceiros (Apple). Caso não desejado, pode ser removido/desabilitado no app.

---

## 7) Vídeo (LiveScreen)

- A tela Ao Vivo utiliza **expo-video** com HLS.
- Se `streams.video.primaryUrl` não existir, o app exibe a mensagem _“Sem canal de vídeo configurado”_.
- Atualmente apenas a URL principal é usada; `fallbackUrls` não são alternados automaticamente.
- Closed Captions são exibidas apenas se existirem trilhas no próprio HLS.

---

## 8) Promos

- A tela de Promos lista `promos.items`.
- Permite:
  - Copiar código do cupom.
  - Compartilhar cupom (com comportamento específico para iOS/Android).
- Caso não existam itens, o app exibe estado vazio.

---

## 9) Compartilhamento (Share)

Na tela principal, o compartilhamento inclui:

- Música atual (quando disponível).
- Nome da rádio.
- Link definido em `station.shareUrl`.

---

## 10) Acessibilidade (iOS + Android)

Recursos implementados:

- Suporte a VoiceOver e TalkBack.
- Anúncios de estado (conectando, erros, agora tocando).
- Labels e hints nos controles principais.
- Textos escaláveis (`allowFontScaling`).
- Elementos decorativos removidos da ordem de foco.

---

## 11) Publicação e Builds

- Recomendado: **EAS Build** para geração de APK (preview) e AAB (produção).
- Verificar:
  - `versionCode` incrementado
  - ícones e splash
  - política de privacidade
  - screenshots da loja

---

## 12) Tenant e Apontamento da Configuração

- O app precisa estar apontando para o tenant/URL correto no momento do build.
- Após publicado, alterações no JSON remoto não exigem nova submissão.
- A troca de tenant ou base URL normalmente requer novo build do app.

---

**FIM**
