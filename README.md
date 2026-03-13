<div align="center">

# 🎴 PokéCollector — Card Gacha Game

**Jogo de coleção de cartas Pokémon estilo Gacha, construído com HTML, CSS e JavaScript puro.**

Abra pacotes, colecione, funda duplicatas e complete sua Pokédex!

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![PokéAPI](https://img.shields.io/badge/PokéAPI-EF5350?style=flat-square&logo=pokemon&logoColor=white)](https://pokeapi.co/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

<!-- Substituir pelo GIF/screenshot real -->
<!-- ![Preview](assets/preview.gif) -->

[🎮 Jogar Demo](#) · [📋 Funcionalidades](#-funcionalidades) · [🚀 Como Jogar](#-como-jogar)

</div>

---

## 📋 Funcionalidades

### 🎰 Sistema Gacha
| Recurso | Descrição |
|---|---|
| **Pull Simples** | Abra 1 pacote por 100 PokéCoins |
| **Multi Pull (×5)** | Abra 5 pacotes por 450 PC (desconto de 10%) |
| **Pull Diário Grátis** | 1 abertura gratuita por dia com sistema de streak |
| **6 Níveis de Raridade** | Comum → Incomum → Raro → Épico → Lendário → Mítico |
| **Probabilidades Reais** | Baseadas no Base Stat Total real de cada Pokémon |
| **Animação de Abertura** | Pokéball shake, glow e reveal com confetti para cartas raras |

### 🎴 Sistema de Cartas
| Recurso | Descrição |
|---|---|
| **Cards 3D Interativos** | Efeito tilt 3D ao mover o mouse sobre as cartas |
| **Efeito Holográfico** | Shimmer animado em cartas Épicas, Lendárias e Míticas |
| **Bordas por Raridade** | Glow colorido progressivo por nível de raridade |
| **Sistema de Favoritos** | Marque cartas como favoritas com ícone de estrela |
| **Contador de Duplicatas** | Badge com quantidade de cópias de cada carta |

### ⚡ Sistema de Fusão
| Recurso | Descrição |
|---|---|
| **Fusão de Duplicatas** | Combine 3 cópias iguais para obter 1 carta de raridade superior |
| **Seleção Visual** | Interface drag-and-drop com slots de fusão |
| **Progressão** | Transforme cartas Comuns em Lendárias através de fusões |

### 🏠 Dashboard
| Recurso | Descrição |
|---|---|
| **Estatísticas** | Pokémon únicos, total de cartas, duplicatas, favoritos, pulls |
| **Progresso por Raridade** | Barras de progresso para cada nível de raridade |
| **Últimas Obtenções** | Carrossel com as cartas mais recentes |
| **Streak Diário** | Contador de dias consecutivos jogando |

### 🎨 Visual & UX
| Recurso | Descrição |
|---|---|
| **Dark & Light Mode** | Toggle completo com persistência de preferência |
| **Partículas Animadas** | Background com partículas flutuantes |
| **Confetti** | Explosão de confetti ao obter cartas raras+ |
| **Responsivo** | Layout otimizado para desktop, tablet e mobile |
| **Toasts** | Notificações contextuais com feedback visual |
| **Persistência** | Progresso salvo no navegador via localStorage |

## 🎲 Sistema de Raridade

A raridade de cada Pokémon é determinada pelo **Base Stat Total (BST)** real:

| Raridade | BST | Exemplo | Prob. Gacha |
|---|---|---|---|
| ★ Comum | < 320 | Caterpie, Magikarp | 40% |
| ★★ Incomum | 320–419 | Pikachu, Charmander | 30% |
| ★★★ Raro | 420–499 | Charizard, Blastoise | 18% |
| ★★★★ Épico | 500–534 | Dragonite, Tyranitar | 8% |
| ★★★★★ Lendário | 535–599 | Articuno, Zapdos | 3.2% |
| ★★★★★★ Mítico | 600+ | Mewtwo, Rayquaza | 0.8% |

## 🛠️ Tecnologias

- **HTML5** — Estrutura semântica, Open Graph, Canvas API
- **CSS3** — Design tokens, custom properties, theming dual, 3D transforms, animações, glassmorphism, grid responsivo
- **JavaScript (ES6+)** — Fetch API, async/await, Promise.allSettled, Canvas API (confetti/partículas), localStorage, DOM virtual
- **[PokéAPI](https://pokeapi.co/)** — 386 Pokémon (Gen I–III) com dados completos

## 📁 Estrutura

```
pokecollector/
├── index.html              # SPA principal
├── src/
│   ├── css/
│   │   └── styles.css      # Theming dual, cards 3D, animações
│   └── js/
│       └── app.js          # Game engine completa
├── README.md
├── LICENSE
└── .gitignore
```

## 🚀 Como Jogar

```bash
git clone https://github.com/SEU_USUARIO/pokecollector.git
cd pokecollector
```

Abra `index.html` no navegador ou use um servidor local:

```bash
python -m http.server 8000
# ou
npx serve .
```

### Mecânicas do Jogo

1. **Comece com 500 PokéCoins** — use-as para abrir pacotes no Gacha
2. **Pull simples (100 PC)** ou **multi ×5 (450 PC)** — ou use o **pull diário grátis**
3. **Cartas novas** rendem +50 PC de bônus, **duplicatas** rendem +10 PC
4. **Colete duplicatas** e use a **Fusão** para evoluir raridades
5. **Favorite** suas melhores cartas e complete o progresso por raridade!

## 📊 Destaques Técnicos

- **Zero Dependências** — 100% vanilla HTML/CSS/JS
- **Game Loop Completo** — Gacha com probabilidades reais, economia de moedas, fusão, coleção
- **Persistência** — Todo progresso salvo em localStorage (funciona offline após carregamento)
- **Performance** — Cache de API em memória via `Map`, batch loading com `Promise.allSettled`
- **Visual Premium** — Cards 3D com perspective/rotateY, holographic shimmer, confetti Canvas
- **Dual Theme** — Sistema completo de dark/light mode com CSS custom properties
- **Código Documentado** — JSDoc, seções organizadas, constantes centralizadas

## 📄 Licença

[MIT License](LICENSE)

---

<div align="center">

Desenvolvido por **Carlos Gabriel dos Santos Modesto**

*Dados fornecidos pela [PokéAPI](https://pokeapi.co/)*

</div>
