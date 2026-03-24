# Guia Visual de Integração — App Rádio White Label

**Público-alvo:** Desenvolvedores de API / Backend  
**Objetivo:** Explicar como cada campo do JSON remoto impacta o app mobile  
**Tecnologias do app:** React Native + Expo  
**Observações importantes:**  
- Este documento é **educacional**  
- **Não altera** o JSON de produção  
- **Não há comentários dentro do JSON**  
- Não envolve código de frontend

---

## Mapa Geral do App

```
[Menu Inferior]
  ├── Rádio   (áudio)
  ├── Live    (vídeo)
  └── Promos  (cupons)

[Topo / Sistema]
  ├── Status Bar (hora/bateria)
  └── Fundo geral do app
```

---

# 1. BRANDING (Identidade Visual)

Responsável por **cores, fundo, textos, cards e estilo do sistema**.

## Estrutura lógica

```
branding.*
  ├── primary
  ├── background
  ├── text
  ├── muted
  ├── border
  ├── card
  ├── logoUrl
  ├── bgImageUrl
  ├── statusBarStyle
  └── navigationMode
```

---

### branding.primary
**Onde aparece**
- Barra do player de rádio
- Botões primários (ex: Copiar código)
- Ícone ativo do menu inferior

**Função**
- Cor principal de destaque da marca

**Impacto visual**
- Define a identidade visual da rádio no app

---

### branding.background
**Onde aparece**
- Fundo das telas Rádio, Live e Promos

**Função**
- Cor base do layout

**Impacto visual**
- Determina se o app é claro ou escuro

---

### branding.text
**Onde aparece**
- Títulos e textos principais

**Função**
- Cor padrão de leitura

---

### branding.muted
**Onde aparece**
- Textos secundários (gênero, validade, legendas)

**Função**
- Reduz destaque visual sem remover informação

---

### branding.border
**Onde aparece**
- Bordas de botões secundários (Instagram, TikTok, Compartilhar)

**Função**
- Padronização visual de contornos

---

### branding.card
**Onde aparece**
- Fundo de cards (cupons, parceiros)

**Função**
- Separar conteúdo do fundo principal

---

### branding.logoUrl
**Onde aparece**
- Splash secundário
- Cabeçalhos institucionais

**Função**
- Logo horizontal da rádio

---

### branding.bgImageUrl
**Onde aparece**
- Fundos visuais grandes (hero/splash)

**Função**
- Atmosfera visual da marca

---

### branding.statusBarStyle
**Onde aparece**
- Barra superior do sistema (hora/bateria)

**Função**
- Garante contraste correto com o fundo

---

### branding.navigationMode
**Onde aparece**
- Sistema Android

**Função**
- Ajusta modo de navegação para dark/light

---

# 2. PLAYER DE RÁDIO (Áudio)

Responsável pelo streaming de áudio e metadados.

## Estrutura lógica

```
streams.radio.*
  ├── primaryUrl
  ├── fallbackUrls
  └── metadataUrl
```

---

### streams.radio.primaryUrl
**Onde aparece**
- Botão Play da tela Rádio

**Função**
- URL principal do stream de áudio

---

### streams.radio.fallbackUrls
**Onde aparece**
- Invisível ao usuário

**Função**
- Garantir continuidade se o stream principal falhar

---

### streams.radio.metadataUrl
**Onde aparece**
- Informações de “Agora tocando”

**Função**
- Endpoint com música/programa atual

---

# 3. LIVE (Vídeo)

Responsável pela transmissão de vídeo ao vivo.

## Estrutura lógica

```
streams.video.*
  ├── primaryUrl
  └── fallbackUrls
```

---

### streams.video.primaryUrl
**Onde aparece**
- Player da tela Live

**Função**
- Stream principal de vídeo (HLS)

---

### streams.video.fallbackUrls
**Onde aparece**
- Invisível ao usuário

**Função**
- Backup automático do vídeo

---

# 4. STATION (Conteúdo Institucional)

Define textos, imagens e parceiros da rádio.

## Estrutura lógica

```
station.*
  ├── name
  ├── genre
  ├── logoUrl
  ├── shareUrl
  ├── heroImages
  └── partners[]
```

---

### station.name
**Onde aparece**
- Título principal da tela Rádio

**Função**
- Nome público da estação

---

### station.genre
**Onde aparece**
- Subtítulo da Rádio

**Função**
- Categoria musical/editorial

---

### station.logoUrl
**Onde aparece**
- Avatar da rádio

**Função**
- Logo quadrado

---

### station.shareUrl
**Onde aparece**
- Botões de compartilhamento

**Função**
- Link público da rádio

---

### station.heroImages
**Onde aparece**
- Banners da tela Rádio

**Função**
- Destaque visual e marketing

---

### station.partners[]
Cada parceiro representa um patrocinador.

**Campos**
- imageUrl → imagem do parceiro
- title → nome exibido
- href → link ao tocar

---

# 5. PROMOS (Cupons)

Responsável pela tela de promoções.

## Estrutura lógica

```
promos.*
  ├── headline
  └── items[]
```

---

### promos.headline
**Onde aparece**
- Título da tela Promos

**Função**
- Cabeçalho editorial

---

### promos.items[]
Cada item representa um cupom.

**Campos**
- id → identificador interno
- title → título do cupom
- image → imagem do card
- code → código copiável
- rulesUrl → regras/termos
- expiresAt → validade

---

# 6. NAVEGAÇÃO

A navegação é influenciada principalmente pelo branding.

```
Menu Inferior
  ├── Cor ativa   -> branding.primary
  ├── Texto       -> branding.text / muted
  └── Fundo       -> branding.background
```

---

# 7. FEATURES (Comportamento)

Controla recursos e rotina do app.

## Estrutura lógica

```
features.*
  ├── enablePictureInPicture
  ├── enableMiniPlayer
  └── checkConfigIntervalSec
```

---

### enablePictureInPicture
**Função**
- Permite vídeo em janela flutuante

---

### enableMiniPlayer
**Função**
- Mantém áudio tocando ao navegar

---

### checkConfigIntervalSec
**Função**
- Intervalo de verificação do JSON remoto

---

## Resumo Final

```
Backend controla:
  ├── Visual (branding)
  ├── Conteúdo (station / promos)
  ├── Streams (rádio / vídeo)
  └── Comportamento (features)

Frontend apenas interpreta.
```

---

**Documento criado para servir como manual visual de integração da API com o App.**
