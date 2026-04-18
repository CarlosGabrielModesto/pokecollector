# PokéCollector

Jogo de coleção de cartas inspirado em mecânicas de gacha, desenvolvido com HTML, CSS e JavaScript puro. O projeto permite abrir pacotes, colecionar cartas, fundir duplicatas e acompanhar o progresso da coleção com dados da PokéAPI.

## Visão geral

O PokéCollector é uma aplicação front-end que simula um sistema de abertura de pacotes com raridade baseada no Base Stat Total (BST) de cada Pokémon. O progresso do jogador é salvo localmente no navegador.

## Funcionalidades

### Sistema de gacha

* Abertura simples de pacote por 100 PokéCoins
* Abertura múltipla de 5 pacotes por 450 PokéCoins
* Abertura diária gratuita com controle de sequência
* Seis níveis de raridade
* Probabilidades definidas com base no BST real dos Pokémon
* Animação de abertura com destaque para cartas mais raras

### Sistema de cartas

* Cartas interativas com efeito visual ao mover o cursor
* Diferenciação visual por raridade
* Marcação de cartas favoritas
* Controle de duplicatas por carta

### Sistema de fusão

* Fusão de 3 cópias iguais para gerar uma carta de raridade superior
* Interface visual para seleção das cartas
* Progressão baseada em duplicatas acumuladas

### Dashboard e progresso

* Estatísticas gerais da coleção
* Progresso por raridade
* Exibição das cartas obtidas recentemente
* Controle de sequência diária de uso

### Interface e experiência

* Tema claro e escuro com persistência de preferência
* Layout responsivo para desktop, tablet e mobile
* Notificações contextuais de ações do usuário
* Salvamento local com `localStorage`

## Sistema de raridade

A raridade de cada Pokémon é definida a partir do seu Base Stat Total (BST).

| Raridade |  Faixa de BST | Exemplos             | Probabilidade |
| -------- | ------------: | -------------------- | ------------: |
| Comum    | abaixo de 320 | Caterpie, Magikarp   |           40% |
| Incomum  |     320 a 419 | Pikachu, Charmander  |           30% |
| Raro     |     420 a 499 | Charizard, Blastoise |           18% |
| Épico    |     500 a 534 | Dragonite, Tyranitar |            8% |
| Lendário |     535 a 599 | Articuno, Zapdos     |          3.2% |
| Mítico   |   600 ou mais | Mewtwo, Rayquaza     |          0.8% |

## Tecnologias utilizadas

* HTML5
* CSS3
* JavaScript (ES6+)
* PokéAPI

## Estrutura do projeto

```text
pokecollector/
├── index.html
├── src/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── README.md
├── LICENSE
└── .gitignore
```

## Como executar

Clone o repositório:

```bash
git clone https://github.com/SEU_USUARIO/pokecollector.git
cd pokecollector
```

Abra o arquivo `index.html` no navegador ou utilize um servidor local:

```bash
python -m http.server 8000
# ou
npx serve .
```

## Mecânicas principais

1. O jogador inicia com 500 PokéCoins.
2. As moedas podem ser usadas em abertura simples, múltipla ou no pull diário gratuito.
3. Cartas novas geram bônus adicional de moedas.
4. Cartas duplicadas podem ser acumuladas para fusão.
5. O progresso da coleção pode ser acompanhado por raridade e favoritos.

## Aspectos técnicos

* Aplicação desenvolvida sem dependências externas
* Consumo de dados da PokéAPI para montagem das cartas
* Persistência local com `localStorage`
* Carregamento assíncrono de dados com `fetch` e `Promise.allSettled`
* Estrutura organizada em HTML, CSS e JavaScript separados

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## Autor

Desenvolvido por **Carlos Gabriel dos Santos Modesto**.

Dados fornecidos pela [PokéAPI](https://pokeapi.co/).
