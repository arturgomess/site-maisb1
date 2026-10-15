# Otimização automática de imagens do Blog Grupo +B

## Objetivo

Processar no backend todas as imagens estáticas enviadas pelo CMS, convertendo-as para WebP, removendo metadados, corrigindo orientação e reduzindo dimensões conforme seu destino. Preservar transparência e proporção, rejeitar originais acima de 2 MB e manter o fluxo visual atual do painel, com a mensagem `Otimizando imagem...` durante o trabalho.

## Arquitetura aprovada

O endpoint autenticado `/api/admin/assets` centraliza a validação e a transformação com Sharp. O cliente verifica o limite antes do envio; o backend repete a validação de tamanho e confirma o formato pela decodificação real dos bytes. Uma allowlist de formatos estáticos suportados pelo Sharp exclui SVG e imagens animadas. Limites de pixels e erros de decodificação protegem contra arquivos inválidos e imagens de custo excessivo.

O CMS envia um destino para banner, galeria ou conteúdo. Banner gera WebP principal (máx. 1920 × 1080) e miniatura (máx. 600 × 400, sem corte/ampliação); galeria gera WebP máx. 1200 × 1200; conteúdo gera WebP máx. 1200 px de largura. Todos mantêm proporção. A compressão inicia em qualidade 80 e pode baixar em etapas para evitar que o resultado exceda o original quando isso for possível sem perda visual exagerada.

Os resultados são gravados no volume persistente `public/uploads` como WebP com nomes aleatórios. Escritas temporárias são limpas em falhas. O modelo de post ganha um caminho opcional de miniatura; conteúdo existente mantém `imagePath` e continua renderizando com fallback. O deploy existente executa `prisma db push` e preserva o volume de uploads.

O editor do ReactQuill substitui o handler padrão de imagem por upload autenticado através do mesmo endpoint; o corpo armazena somente URL WebP, dimensões e atributos de lazy loading. A capa, a galeria, as miniaturas de listagem e o conteúdo publicado usam os caminhos processados. O painel mantém sua composição atual e apresenta somente `Otimizando imagem...` enquanto processa.

## Compatibilidade e segurança

- Original permitido até 2 MiB (inclusive), verificado tanto no cliente quanto no servidor.
- MIME e extensão do navegador não são confiáveis; o formato é identificado pela biblioteca nos bytes originais.
- Formatos estáticos explicitamente permitidos conforme suporte do Sharp; rejeitar SVG, animações, arquivo inválido e conteúdo com excesso de pixels.
- Imagens antigas não são convertidas nem removidas. Campos e caminhos existentes continuam válidos.
- Falhas não deixam arquivo final parcial; erros são apresentados ao administrador sem quebrar o formulário.

## Verificação

Adicionar testes unitários e de integração para limite, detecção real de tipo, WebP, qualidade/tamanho, orientação, proporção, transparência, limites dimensionais, arquivo inválido e limpeza em erro. Cobrir o endpoint autenticado e o uso das imagens nas listagens/artigo (miniatura, dimensões e lazy loading). Executar testes, typecheck e build; não executar `db push` contra banco local/de produção durante validação.
