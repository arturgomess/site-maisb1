# Changelog

- **Otimização Global de Mídias (-127 MB), Controles de Vídeo em Tela Cheia e Suporte HTTP 206 Range (11/09/2026)**:
  - **Redução Drástica de Tamanho do Projeto (-126.6 MB)**: O repositório e o projeto foram enxugados de 157.5 MB para apenas 30.8 MB. Foram eliminados mais de 90 arquivos obsoletos (vídeos duplicados/pesados, zips de backup, mockups de design não utilizados e scripts legados).
  - **Conversão Completa para WebP**: Todas as fotografias e ícones restantes foram convertidos para formato WebP de alta fidelidade e compressão otimizada.
  - **Controles de Vídeo em Tela Cheia (`InstitutionalVideoHero`)**: Implementada interface em tela cheia com auto-hide inteligente ao ficar inativo (~2,6s) e reaparecimento instantâneo ao movimentar o mouse. Barra de progresso ultra-minimalista em amarelo vibrante (`#ffc400`) com suporte a clique e arraste (*scrubbing* via Pointer Capture).
  - **Suporte a Byte-Range Requests (HTTP 206 Partial Content)**: Atualizado o manipulador de rota estática (`app/assets/[...path]/route.ts`) com suporte nativo a cabeçalho `Range`, `Accept-Ranges: bytes` e respostas 206. Isso desbloqueou o avanço e retrocesso instantâneo de mídia em qualquer navegador.

- **Página de Política de Privacidade & Termos de Uso (/termos-e-privacidade) e Faxina dos HTMLs Legados (04/09/2026)**:
  - **Criação da Rota Nativa em Next.js (`app/termos-e-privacidade/page.tsx`)**: Rota estruturada no padrão Next.js 15, herdando `SiteHeader` e `SiteFooter`, com metadados completos de SEO e conformidade com a LGPD (Lei nº 13.709/2018).
  - **Design System e Estilo Dedicado (`src/css/legal.css`)**: Hero institucional Dark Glow (`#120E0E` e `#C89223`), Breadcrumb interativo, Badge de conformidade, Card Central Clean (`#FFFFFF`) para leitura agradável e botão funcional de impressão (`components/print-button.tsx`) com folha de estilo `@media print` pronta para PDF.
  - **Conteúdo Jurídico Institucional Completo**: 8 cláusulas detalhadas de Privacidade (coleta ética, cookies, direitos do titular e DPO) e 8 cláusulas de Termos de Uso (propriedade intelectual das marcas do grupo e foro na Comarca de Belém/PA).
  - **Conexão no Rodapé (`components/site-footer.tsx`)**: Substituído o link placeholder por `<Link href="/termos-e-privacidade">`.
  - **Limpeza dos Arquivos Estáticos Obsoletos**: Excluídos da raiz do projeto os 7 arquivos `.html` legados (`index.html`, `links.html`, `mapinha.html`, `noticia.html`, `noticias.html`, `rodape-separado.html`, `sobre-nos.html`), consolidando o projeto como 100% puro Next.js.


- **Integração do Localizador Interativo de Lojas (`/ver-mapinha`) e Otimização Mobile da Home**:
  - **Página Interativa `/ver-mapinha`**: Implementado mapa interativo com Leaflet, filtros por bandeira (+B Supermercados, The Wine Experience, +B Farma), geolocalização do usuário, cálculo de proximidade e rotas no Google Maps.
  - **Banner Mobile Trabalhe Conosco**: Integração de assets mobile dedicados (`trabalhe-mobile-real.webp` e `trabalhe-mobile.webp`) com renderização proporcional e responsiva.
  - **Aprimoramento de Seções e Componentes da Home**: Ajustes refinados de layout, header, footer e seções institucionais em Next.js e nos estilos CSS (`brands.css`, `hero.css`, `sections.css`, `work-units-footer.css`).

- **Ajustes Personalizados nos Cards da Seção Nossas Marcas**:
  - **Headline em 38px e Sempre Branca**: Definido `font-size: 38px !important;` e `color: #ffffff !important;` em `.card-brand-title` e `.card-brand-title.serif-font` em [src/css/brands.css](file:///c:/.PROJETOS%20-%20Sites%202026/site-maisb1-next/src/css/brands.css), garantindo títulos destacados e sempre na cor branca.
  - **Cores de Categoria dos Itens (`.card-brand-keywords`)**:
    - **Villa Plaza Restaurante**: Atualizado para tom vermelho sofisticado de alto contraste (`#e63946 !important;`).
    - **Villa Plaza Park**: Mantido no verde original (`#c2f16a !important;`).
    - **Restante das marcas (The Wine, Supermercados +B, +B Farma)**: Definido no ouro gold oficial do Grupo (`var(--color-yellow, #C89223) !important;`).
  - **Arredondamento dos Botões Padronizado**: Removido formato de pílula (`999px`) e 4px, aplicando `border-radius: var(--radius-small, 6px) !important;` em `.btn-card-primary`, `.btn-card-secondary` e `.open-map-trigger` em [src/css/brands.css](file:///c:/.PROJETOS%20-%20Sites%202026/site-maisb1-next/src/css/brands.css), alinhando ao padrão visual dos botões do site.
  - **Invalidação de Cache**: Atualizada versão do CSS em [src/css/main.css](file:///c:/.PROJETOS%20-%20Sites%202026/site-maisb1-next/src/css/main.css) (`brands.css?v=12.4`) e no [index.html](file:///c:/.PROJETOS%20-%20Sites%202026/site-maisb1-next/index.html) (`main.css?v=13.6`).

- **Refinamento do Subtítulo de Marcas e Animações da Seção Institucional**:
  - **Subtítulo Limpo de Nossas Marcas**: Adicionada a classe `.brands-subtitle-badge-wrapper` sem bordas/fundos pesados em [app/globals.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/app/globals.css).
  - **Seção Sobre o Grupo**: Limpeza do card de vidro flutuante redundante em [sobre-nos.html](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/sobre-nos.html) e estabilização de transições `.reveal` em [components/home-sections.tsx](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/components/home-sections.tsx) e [src/css/sections.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/sections.css).

- **Padronização do Botão "Ver Todas as Notícias" com o Design System**:
  - **Alinhamento Visual com os Demais CTAs**: Substituído o formato pill oval/amarelo (`border-radius: 999px`) do botão `.btn-news-all` pelo padrão oficial institucional do Design System (`border-radius: 8px`, fundo escuro `#111111`, tipografia refinada em caixa alta e hover dourado `#B58729` com transição suave da seta).
  - **Invalidação de Cache**: Atualizada a versão em [src/css/main.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/main.css) (`noticias.css?v=12.8`) e em todos os arquivos HTML (`main.css?v=13.5`).

- **Correção da Quebra de Linha na Seção Trabalhe Conosco**:
  - **Eliminação de Letra Órfã/Viúva**: Corrigida a quebra de linha da headline (`.trabalhe-card-headline`) para `Construa sua história<br>com o Grupo Mais Barato.`, garantindo simetria perfeita em duas linhas equilibradas e eliminando a letra "o" isolada em linha única.
  - **Proteção Tipográfica Responsiva**: Aplicado `text-wrap: balance` e `white-space: nowrap` (no destaque de marca em desktop/tablet) com liberação fluida no mobile em [src/css/sections.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/sections.css).
  - **Invalidação de Cache**: Atualizadas versões em [src/css/main.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/main.css) (`sections.css?v=12.7`) e em [index.html](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/index.html) (`main.css?v=13.4`).

- **Cantos Arredondados no Rodapé e Seção Nossas Marcas**:
  - **Rodapé / Localizador de Unidades (`.footer-gold`)**: Adicionado `border-radius: 120px 120px 0 0 !important;` no desktop e `40px 40px 0 0 !important;` no mobile/tablet em [src/css/work-units-footer.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/work-units-footer.css), com `overflow: hidden` e padding superior calibrado para transição elegante.
  - **Seção Nossas Marcas (`.brands-black-block`)**: Atualizado `border-radius` para `120px` no desktop (arredondando a parte inferior e superior simetricamente) e `40px !important` no mobile/tablet em [src/css/brands.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/brands.css).
  - **Invalidação de Cache**: Atualizadas versões em [src/css/main.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/main.css) (`brands.css?v=12.2`, `work-units-footer.css?v=12.3`) e links em todos os HTMLs (`main.css?v=13.2`).
  - **Inversão de Posição**: A seção **Trabalhe Conosco** (`#oportunidades`) foi posicionada logo acima da seção **Notícias & Novidades** (`#noticias`), vindo na sequência das submarcas.

- **Atualização da Imagem de Fundo da Seção Trabalhe Conosco**:
  - **Nova Imagem**: Substituída a imagem anterior por `assets/Paginas (Imagens)/Home/banner-trabalhe-conosco-v2.webp` em [src/css/sections.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/sections.css) tanto no layout desktop quanto na media query responsiva para mobile/tablet.
  - **Invalidação de Cache**: Atualizada a versão dos estilos em [src/css/main.css](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/main.css) (`sections.css?v=12.6`) e em [index.html](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/index.html) (`main.css?v=13.1`).

- **Responsividade Total na Seção de Unidades (Store Locator no Mobile)**:
  - **Ajuste de Largura e Eliminação de Overflow**: Adicionadas regras de `box-sizing: border-box`, `overflow: hidden` e limitação de larguras para impedir qualquer corte ou estouro horizontal na seção de unidades e na barra de pesquisa no mobile.
  - **Redimensionamento Fluido dos Cards e Miniaturas**: Em telas menores que 640px e 380px, as miniaturas das fotos foram ajustadas dinamicamente (78px e 66px), com paddings e gaps compactos e fluidos para manter todo o conteúdo perfeitamente contido na tela.
  - **Quebra Elegante de Títulos e Textos**: Os títulos das unidades (`.unit-card-title`) agora utilizam `-webkit-line-clamp: 2` com quebra fluida de linha, exibindo o nome completo da loja sem cortes forçados (`...`) ou quebras estragadas.
  - **Botão "Ver no Google Maps" Adaptativo**: Ajustados padding, font-size e posicionamento do botão para garantir encaixe ideal sem ultrapassar as bordas dos cards em qualquer largura de tela (desde Galaxy Fold 320px até iPhone 14/15/16 Pro Max).
  - **Sincronização nos Arquivos**: Estilos aplicados e sincronizados em [`work-units-footer.css`](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/src/css/work-units-footer.css) e [`mapinha.html`](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/mapinha.html).

- **Correção da Sombra Quadrada no Ícone Central (Hub da Espiral)**:
  - **Formato 100% Circular no Hub Central**: Adicionada a regra `border-radius: 50% !important;` na classe base e nas media queries de `.brands-hub-center`, eliminando os cantos quadrados da sombra e transformando o glow e o container central em um círculo suave e perfeito.
  - **Invalidação de Cache**: Atualizada a versão dos estilos para `main.css?v=10.4` e `brands.css?v=9.4`.

- **Ajustes no Carrossel da Seção Nossas Marcas no Mobile**:
  - **Correção da Queda/Deslocamento do Emblema do Card**: Corrigido o bug onde o ícone/emblema central sobreposto (`.card-logo-overlap`) sofria alteração de `transform` e descia/caía ao ser clicado ou tocado em dispositivos móveis. A posição foi fixada firmemente em `top: 0; left: 50%; transform: translate(-50%, -50%) !important;` em todos os estados de interação.
  - **Feedback Ativo com Borda e Brilho Reforçados**: No clique, toque ou foco, o emblema da marca ativa recebe borda de 2px e iluminação sutil temática intensificada (box-shadow com glow correspondente à cor da submarca), proporcionando feedback visual claro de que está ativo sem nenhum salto postural.
  - **Setas de Navegação Ativas no Mobile**: Adicionadas e estilizadas as setas flutuantes de navegação (`<` e `>`) centralizadas na galeria de fotos superior do card em telas mobile e tablet (`@media (max-width: 980px)` e `@media (max-width: 620px)`), com acabamento translúcido glassmorphism e iluminação dourada ao toque, indicando imediatamente que a seção é um carrossel navegável.



- **Atualização dos Textos e Cores da Seção "Sobre o Grupo" (Home e Sobre Nós)**:
  - **Headline**: Atualizada para *"O Grupo Mais Barato reúne negócios que fazem parte do dia a dia das pessoas de Belém–PA"* com destaque em serif dourado itálico para "Grupo Mais Barato" e prevenção de quebra (`white-space: nowrap`) em "Belém–PA".
  - **Unificação da Cor Amarelo Ouro Premium (`#C49A45`)**: Substituído o amarelo vivo (`#FFC400`) pelo tom dourado oficial/premium (`#C49A45`) em todas as instâncias (eyebrow, destaque itálico da headline, midTexto e traço decorativo inferior), garantindo total consistência com o padrão da Home e Sobre Nós.
  - **MidTexto**: Adicionado o texto intermediário em destaque dourado: *"Conectando varejo, gastronomia, saúde, bem-estar e serviços com qualidade, inovação e proximidade."*
  - **Texto Principal**: Atualizado o parágrafo institucional com o compromisso de inovação, experiência, excelência e desenvolvimento comunitário sustentável.
  - **Harmonização Visual**: Padronizado com traço dourado decorativo (`.gold-accent-line`) e estilos sincronizados em `index.html`, `sobre-nos.html` e `src/css/sections.css`.

- **Ajuste de Responsividade na Seção de FAQ (Dúvidas Frequentes)**:
  - **Layout de 1 Coluna no Mobile e Tablet**: Ajustado o grid `.faq-grid` para empilhar em 1 coluna única (`grid-template-columns: 1fr`) em telas menores que 991px, 768px e 480px, eliminando o esmagamento das 2 colunas laterais no celular.
  - **Ajustes de Espaçamento e Tipografia**: Redefinidos os paddings, gaps, tamanhos de fontes e espaçamento interno dos cards de perguntas e respostas para visualização confortável e fluida em smartphones.

- **Ajustes na Seção de Marcas da Home**:
  - **Aumento do Tempo de Exibição e Pausa ao Passar o Mouse**: Aumentado o `SLIDE_DURATION` de 5.000ms para 9.000ms (9 segundos) no carrossel de marcas em `src/js/main.js`, proporcionando tempo suficiente para a leitura de textos e visualização das fotos. Adicionada também a pausa automática ao passar o mouse (`mouseenter`/`mouseleave`) sobre o palco do carrossel.
  - **Descritivo do Supermercados +B**: Removida a palavra "utilidades", ficando: *"Rede de supermercados com mix completo de alimentos e ofertas para a rotina das famílias."*
  - **Descritivo do Villa Plaza Park**: Inserido o destaque: *"Maior Parque infantil de Belém, pensado para crianças e famílias, com atrações, segurança e muita diversão para os pequenos."* (atualizado em `index.html` e `src/data/brands.js`).

- **Remoção da Seção de Eventos na Home**:
  - Removida a seção de eventos ("APROVEITE E CONHEÇA" / "+B RUN") de `index.html`.

- **Atualização da Imagem do marco "Shopping Bosque Grão Pará" na Linha do Tempo**:
  - Atualizada a foto do marco **2026: Inauguração do +B Supermercados – Shopping Bosque Grão Pará** em `sobre-nos.html` (miniatura do nó 10) e em `src/js/main.js` (`data[10].img`) para `./assets/Fotografias/maisb-grao-para.webp`.
  - Atualizada a versão do script em `sobre-nos.html` para `main.js?v=9.4` para invalidação de cache.

- **Atualização da Imagem do marco "Mudança da marca para +B Supermercados" na Linha do Tempo**:
  - Atualizada a foto do marco **2025: Mudança da marca para +B Supermercados** em `sobre-nos.html` (miniatura do nó 8) e em `src/js/main.js` (`data[8].img`) para `./assets/Fotografias/maisb-supermercados-marca-na-parede.webp`.
  - Atualizada a versão do script em `sobre-nos.html` para `main.js?v=9.3` para invalidação de cache.

- **Atualização da Imagem do Villa Plaza Park Tapanã na Linha do Tempo ("Nossa Trajetória")**:
  - Convertida e otimizada a fotografia de alta resolução `Sessão Villa Plaza Park - 037.jpg` para WebP (`villa-plaza-park-tapana.webp` em `assets/Fotografias/Villa Plaza (Park Infantil)/`).
  - Atualizada a foto do marco **2026: Inauguração do Villa Plaza Park – Unidade Tapanã** em `sobre-nos.html` (miniatura do nó 9) e em `src/js/main.js` (`data[9].img`).
  - Atualizada a versão do script em `sobre-nos.html` para `main.js?v=9.2` para invalidação de cache.

- **Atualização da Imagem do Centro de Distribuição na Linha do Tempo ("Nossa Trajetória")**:
  - Atualizada a foto do marco **2022: Ampliação do Centro de Distribuição** em `sobre-nos.html` (miniatura do nó 4) e em `src/js/main.js` (`data[4].img`) para `./assets/Fotografias/CENTRO-DISTRIBUICAO.webp`.
  - Atualizada a versão do script em `sobre-nos.html` para `main.js?v=9.1` para invalidação de cache.

- **Atualização Completa da Linha do Tempo ("Nossa Trajetória") em Sobre Nós**:
  - Reestruturada a Timeline interativa com os 11 marcos cronológicos oficiais:
    1. **2015**: Início da história com o Mais Barato Tapanã
    2. **2016**: Lançamento da +B Farma
    3. **2021**: Inauguração do Mais Barato – Plaza
    4. **2022**: Lançamento do Mais Barato – Alcindo Cacela
    5. **2022**: Ampliação do Centro de Distribuição
    6. **2022**: Inauguração do The Wine
    7. **2023**: Inauguração do Villa Plaza
    8. **2023**: Inauguração do Villa Plaza Park - Unidade Plaza
    9. **2025**: Mudança da marca do Mais Barato para +B Supermercados
    10. **2026**: Inauguração do Villa Plaza Park – Unidade Tapanã
    11. **2026**: Inauguração do +B Supermercados – Shopping Bosque Grão Pará
  - Atualizados os dados em `src/js/main.js` (`initTrajetoriaTimeline`), os 11 nós com imagens correspondentes em `sobre-nos.html`, dimensionamento refinado em `src/css/timeline.css` e invalidação de cache (`main.css?v=11.0`, `timeline.css?v=8.2`, `main.js?v=9.0`).

- **Padronização da Nomenclatura das Unidades no Localizador de Lojas**:
  - Atualizados os títulos dos cards e atributos `alt` de imagens em `index.html` e `sobre-nos.html`, no banco de dados (`src/data/units.js`) e no gerador de cards (`src/js/unidades.js`) para a nomenclatura oficial: **+B Supermercados (Plaza)**, **+B Supermercados (Alcindo Cacela)** e **+B Supermercados (Tapanã)**.

- **Centralização de Termos & Privacidade no Footer**:
  - Reestruturada a barra inferior do footer (`.footer-minimal-bottom-bar` em `src/css/work-units-footer.css`) para utilizar layout CSS Grid de 3 colunas (`1fr auto 1fr`), alinhando o link *Termos & Privacidade* perfeitamente ao centro (50% de largura) com responsividade para dispositivos móveis.

- **Ajuste na Sombra e Transição da Seção "Sobre o Grupo" (Sobre Nós)**:
  - Suavizada a sombra inferior (`box-shadow`) e adicionada margem inferior de `48px` na classe `.about-premium-dark-section` em `src/css/sections.css`, eliminando o efeito de linha preta recortada na transição para a seção Timeline.
  - Invalidado cache em `sobre-nos.html` e `main.css` (`v=9.9`).

- **Integração do Submenu "Nossas Marcas" com a Espiral e Unificação do Header**:
  - **Ativação Direta das Marcas**: Atualizados os links do submenu dropdown *Nossas Marcas* (`#marca-super`, `#marca-farma`, `#marca-plaza`, `#marca-park`, `#marca-wine`) para que, ao clicar em qualquer submarca no topo, a página navegue suavemente e abra imediatamente o card correspondente na espiral.
  - **Menu Superior Padronizado**: Removido o item `Home` excedente de `sobre-nos.html`, tornando o menu superior idêntico em ambas as páginas (`Sobre` | `Nossas Marcas` | `Contato`).
  - **Captura Global de Cliques**: Atualizada a função em `src/js/main.js` para escutar e tratar cliques em `a[href*="#marca-"]`.

- **Ajuste de Alinhamento da Imagem "Trabalhe Conosco" (Home)**:
  - Alterado o posicionamento da imagem de fundo do banner em `src/css/sections.css` para `top right` (superior direito).
  - Invalidado cache dos estilos em `index.html` e `main.css` (`v=9.8`).

- **Alinhamento Justificado na Timeline ("Nossa Trajetória")**:
  - Aplicada a propriedade `text-align: justify` na descrição dos marcos históricos da Timeline (`.trajetoria-event-desc` em `src/css/timeline.css`).
  - Invalidado cache dos estilos em `sobre-nos.html` e `main.css` (`v=9.7`).

- **Atualização da Imagem de Fundo "Trabalhe Conosco" (Home)**:
  - Atualizada a imagem de fundo do card da Seção Trabalhe Conosco em `src/css/sections.css` (e invalidado o cache em `index.html` e `main.css`) para a imagem `banner-trabalhe-conoscoo.png`.

- **Atualização da Foto Oficial da Seção "Sobre o Grupo"**:
  - Atualizada a fotografia da Seção "Sobre o Grupo" em `index.html` e `sobre-nos.html` para a imagem em alta resolução com a equipe e fachada (`foto-grupo-b-em-fente-fachada_pessoas.png`).

- **Unificação do Hero com Vídeo Background & Barra de Progresso Exclusiva Fullscreen**:
  - **Hero Banner 100% Vídeo**: Removido o slide inicial estático de foto da fachada da Home (`index.html`) e mantido o vídeo institucional em background contínuo com a headline oficial *"Somos o Grupo Mais Barato"*.
  - **Foto Oficial na Seção Sobre o Grupo**: Atualizada a imagem da segunda seção da Home para a fotografia oficial da fachada com a equipe (`foto-grupo-b-em-fente-fachada_IA.webp`).
  - **Textos Justificados**: Aplicado alinhamento totalmente justificado (`text-align: justify`) nos parágrafos descritivos da seção *"Sobre o Grupo"* em `sobre-nos.html` e `index.html`.
  - **Barra de Progresso Exclusiva em Tela Cheia**: Ocultada a barra de progresso por padrão fora do modo fullscreen (`display: none !important`). Em tela cheia, a UI é exibida por 1 segundo e oculta-se automaticamente, reaparecendo apenas ao movimentar o ponteiro do mouse na parte inferior da tela.
  - **Invalidação de Cache (`v=9.6`)**: Atualizada a tag de versão das folhas de estilo em `index.html` e `sobre-nos.html`.

- **Recriação e Redesign Premium da Seção "Nossas Marcas / Espiral"**:
  - **Correção da Falha de Sintaxe no CSS**: Identificada e corrigida a chave não fechada na regra `.gallery-panel` do `src/css/brands.css`, restaurando todo o código CSS descartado pelo navegador.
  - **Medalhões Circulares Glassmorphism**: Reestilizados os ícones satélites das submarcas na espiral (`.node-logo-wrapper`) para formato 100% circular (`border-radius: 50%`), eliminando caixas pretas quadradas e aplicando fundo translúcido com brilho sutil.
  - **Emblema da Marca Sobreposto 100% Circular**: Ajustado `.card-logo-overlap` no card de detalhes com borda ultrafina de 1px discreta e efeito de vidro escuro.
  - **Suavização dos Efeitos de Hover**: Atenuadas as sombras e bordas estouradas dos cards e medalhões, aplicando iluminação elegante e sombras de profundidade realistas.
  - **Setas Flutuantes Restauradas**: Setas laterais circulares de 48px com acabamento em vidro e iluminação suave ao passar o mouse.
  - **Invalidação de Cache (`v=9.2`)**: Incrementada a versão das folhas de estilo em `index.html` e `main.css` para atualização imediata nos navegadores.

- **Remoção da Linha de Valores e Redesign de Métricas ("Sobre Nós")**:
  - Removida a linha de blocos de valores (`PROPÓSITO`, `PESSOAS`, `EXCELÊNCIA`, `FUTURO`) de [sobre-nos.html](file:///g:/Meu%20Drive/.PROJETOS/Sites%20Institucionais/site-maisb1/sobre-nos.html) conforme solicitado.
  - Mantida apenas a linha de números/métricas da trajetória no layout *open row* minimalista com divisores finos e tipografia limpa.

- **Controles do Vídeo Hero Institucional ("Sobre Nós")**:
  - **Barra de Progresso Minimalista Interativa**: Adicionada a linha de tempo no centro inferior da seção do vídeo topo (`.video-progress-container`), com visual minimalista dourado (`var(--yellow)`), atualização em tempo real do tempo decorrido do vídeo e suporte a clique/arraste para avançar ou retroceder a reprodução (*scrubber*).
  - **Botão Fullscreen no Canto Inferior Direito**: Posicionado ao lado direito do botão de Mute/Unmute, com estilo idêntico em vidro escuro e brilho dourado (`.video-fullscreen-btn`), alternando a exibição em tela cheia do vídeo/seção com alteração dinâmica de ícones.

- **Correção dos Links e Endereços do Google Maps ("Nossas Unidades")**:
  - Atualização dos URLs do Google Maps para a API de Busca oficial (`https://www.google.com/maps/search/?api=1&query=...`), garantindo direcionamento exato para a página oficial do estabelecimento em cada unidade (+B Supermercado Alcindo Cacela, +B Supermercado Tapanã e +B Supermercado Villa Plaza).
  - Correção dos endereços e coordenadas no banco de dados (`src/data/units.js`) e na Home (`index.html`):
    - **Alcindo Cacela**: Atualizado para `Av. Alcindo Cacela, 1848 - Nazaré` (coordenadas reais: `[-1.4516, -48.4779]`).
    - **Tapanã**: Atualizado para `Rod. Tapanã, 597 - Tapanã`.
    - **Villa Plaza**: Atualizado para `Av. Gov. José Malcher, 2388 - São Brás`.
  - Atualização no gerador de cards de unidades (`src/js/unidades.js`) para utilizar o fallback de busca de localização oficial do Google Maps.

## 2026-07-27

- **Eliminação de Botões e Cores Vermelhas**:
  - Substituído o botão vermelho `.red-btn` no modal/árvore de links (`links.html` e `src/css/links.css`) pelo novo **botão branco premium (`.white-btn`)** com fundo `#FFFFFF` sólido, texto preto (`#000000`) e hover limpo.
  - Removido o hover vermelho do botão de fechar (`.card-close-btn`) e dos itens de marca (`.brand-super`, `.brand-farma`), padronizando com brilho dourado e transparências minimalistas.
- Correção e refinamento de design da página **Sobre Nós** (`sobre-nos.html`):
  - **Substituição da Imagem Principal**: Atualizada a foto da Seção 1 para a foto oficial da fachada do supermercado (`unid-plaza-foto-de-fachada-vila-plaza.webp`).
  - **Correção da Foto do Marco 2019**: Corrigido o caminho do arquivo da foto da +B Farma (`./assets/Fotografias/Mais B Farma/foto-banner-maisb-farmacia.webp`), resolvendo o problema da imagem quebrada na Linha do Tempo.
  - **Nova Tag Minimalista da Timeline**: Substituída a antiga pílula amarela de timeline pela tag oficial sem fundo (`.eyebrow-gold`), alinhada ao padrão visual minimalista do projeto.
  - **Refinamento dos Blocos de Valores e Métricas**: Reformulação em layout *open-row* com divisores verticais minimalistas em Dark Mode (fundo limpo `#08080c`, números em grande escala e sem containers de bordas pesadas), fiéis ao estilo do Print 2.
- Remoção dos indicadores de pontinhos/traços no carrossel do topo Hero (`index.html`, `src/css/hero.css` e `src/js/hero-carousel.js`), mantendo exclusivamente a barra de progresso horizontal refinada.
- Refatoração da **Seção 2 (Sobre o Grupo / "sobrenoszinho")** da Home (`index.html` e `src/css/sections.css`) com alinhamento 100% idêntico à referência do protótipo (`s2-sobrezinho.png`).
- Atualização da foto principal da Seção 2 para a fachada oficial (`s1-topo-hero-foto-.png`).
- Aplicação do estilo de tipografia serifada itálica em dourado (`.headline-highlight-italic`) na palavra de destaque *"expansão."*.
- Reestruturação das métricas (`.about-stats-row`): alinhamento à esquerda, números em destaque (`font-weight: 700`), divisores verticais em tom dourado (`#C49A45`) e espaçamentos simétricos.
- Atualização da versão do CSS em `index.html` para `?v=8.5`.

## 2026-07-22

- Atualização dos nomes e cargos dos depoimentos no carrossel da Home (`index.html`): **Miki Nogani (Cliente +B)**, **Karina Santos (Cliente +B)**, **Maria Antonieta (Cliente +B)** e **Olhala & Equipe (Parceiro Institucional)**.
- Atualização da imagem do marco **2019 (Nascimento da Rede +B Farma)** na Linha do Tempo "Nossa Trajetória" (`sobre-nos.html` e `main.js`) para a foto oficial da farmácia (`foto-banner-maisb-farmacia.webp`).
- Atualização dos textos da seção Eventos na Home (`index.html`): badge alterado para **"APROVEITE E CONHEÇA"** e título principal atualizado para **"Eventos +B feitos para cuidar de você e reunir quem você ama"**.
- Substituição dos vídeos duplicados do carrossel da seção Depoimentos da Home (`index.html`) por 4 vídeos reais e inéditos (`depoimento-cliente-parceiro-mais-b.mp4`, `depo-japa.mp4`, `depo-fk.mp4` e `depo-olhala.mp4`), otimizados para reprodução web.
- Conversão global de caminhos absolutos (`/assets/`) para relativos (`./assets/`) em todo o projeto, garantindo 100% de compatibilidade e carregamento de imagens no protocolo local (`file://`) e no servidor web.
- Correção das fotos quebradas na linha do tempo "Nossa Trajetória" (`main.js` e `sobre-nos.html`), atualizando todos os marcos históricos com mídias de alta definição dos assets.
- Reformulação do modal Lightbox do álbum de fotos (`album.css`): aplicação de `object-fit: contain` e ampliação do modal no desktop para exibir fotos horizontais e verticais 100% completas sem nenhum corte lateral.
- Inclusão das 3 novas fotos oficiais de equipe e liderança do Grupo +B (Holding) no álbum da marca.
- Limpeza dos títulos das fotos do álbum (`album.js`), removendo redundâncias com o nome da unidade e mantendo o identificador visual nas pílulas/badges vermelhas.
- Restrição dinâmica da barra de subfiltros (departamentos) exclusivamente para a categoria Supermercados +B.
- Revisão completa do álbum de fotos na página Sobre Nós (`src/js/album.js`): correção de nomes de setores (Exposição e Mercearia Alcindo, Açougue Alcindo, Hortifrúti Selecionado Alcindo), remoção de fotos duplicadas e atualização das imagens das submarcas (+B Farma, Villa Plaza Park e Grupo +B).
- Reformulação do álbum da submarca The Wine Experience para exibir exclusivamente suas 4 fotos oficiais de ambientação, adega e degustação, removendo fotos genéricas do supermercado.
- Atualizados os botões "Ver links" dos cards de marcas em destaque para abrirem em nova guia (`target="_blank"`) apontando diretamente para os canais do Linktree (The Wine, Supermercados +B, +B Farma, Villa Plaza Park e Villa Plaza Restaurante).
- Substituídas e otimizadas em formato WebP as fotos da galeria dos cards de Supermercados +B (`00_CardHome`), +B Farma e Villa Plaza Park, reduzindo o consumo de banda em até 90%.
- Removido o efeito de zoom forçado (`transform: scale(2.4)`) e posicionamentos extremos nos cards de Marcas em Destaque (`+B Farma` e `Villa Plaza Park`) no arquivo `src/css/brands.css`.
- Reenquadradas as fotos das galerias com `object-fit: cover` e `object-position: center 20%` para exibir o assunto principal (rostos dos atendentes, prateleiras e ambientes) de forma inteira e natural sem distorção.
- Incrementada a versão do import CSS em `src/css/main.css` para `?v=8.4` garantindo a atualização imediata nos navegadores dos usuários.

## 2026-07-21

- Atualizadas as imagens de fundo do carrossel no topo da Home (`index.html`) para os slides "Trabalhe Conosco" (`topo-banner-trabalhe-conosco.webp`) e "Seja parceiro" (`topo-banner-seja-parceiro.webp`).
- Reordenados os slides do carrossel do topo: "Trabalhe Conosco" passou a ser o 2º slide e "Seja parceiro" o 3º slide.
- Removidos os filtros overlay coloridos (vermelho e amarelo) dos slides do topo, deixando o fundo limpo das imagens originais.
- Reestilizados os elementos visuais dos dois slides no topo: adicionadas tags/badges duplas com ícones (maleta e coração com aperto de mão) e bordas em destaque.
- Ajustados os botões do topo ("Quero me candidatar" e "Quero agendar reunião") com fundo preto sólido e estados de hover personalizados.
- Definida a escrita da seção do topo do Trabalhe Conosco inteiramente na cor preta sólida (`#000000`).
- Corrigida a responsividade e estabilidade visual da seção de Depoimentos Premium (`.testimonials-section-premium`) para diferentes níveis de zoom do navegador (110%, 125%, 150%) e resoluções de tela (notebooks, monitores grandes e TVs).
- Removido o colapso precoce do layout em 1320px, mantendo a grade fluida em 2 colunas (`minmax(0, 1fr) minmax(280px, 400px)`) para telas de desktop.
- Adicionada restrição de largura máxima (`max-width: 1440px`) com centralização automática no container para garantir proporção perfeita em monitores Ultra-Wide e TVs 4K.
- Reajustado o alinhamento vertical e a ancoragem das setas de navegação (`.testimonials-prev-btn` e `.testimonials-next-btn`) com base no centro dos cards de vídeo 9:16.

## 2026-07-20

- Adicionado link externo para o site da Mais B Run (`https://www.maisbrun.com.br/`) no banner da seção "Conheça nossos eventos" na Home (`index.html`).
- Separado o elemento wrapper externo (`.events-banner-wrapper`) do container de recorte interno (`.events-banner-inner`) no HTML e CSS para preservar totalmente a sombra projetada (`box-shadow`) e a animação de hover (`translateY(-8px)`).
- Intensificada a sombra projetada no estado padrão (`box-shadow: 0 14px 35px rgba(0, 0, 0, 0.15)`) e no estado de hover (`box-shadow: 0 26px 65px rgba(0, 0, 0, 0.35)`).
- Atualizada a versão de cache dos arquivos CSS para `?v=6.0` em `index.html`, `sobre-nos.html` e `main.css`.

## 2026-07-08

- Sincronização inicial automática e mapeamento da estrutura do projeto.
