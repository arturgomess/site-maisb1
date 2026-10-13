# Otimização de imagens do Blog Grupo +B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converter todo upload do CMS para WebP seguro e redimensionado, preservando o painel atual e entregando imagens menores e adequadas em artigos, galerias e cards.

**Architecture:** Sharp valida e processa os bytes no endpoint autenticado existente. O CMS envia o destino e grava URLs WebP; banner também produz miniatura de card. Um campo opcional no post liga a miniatura sem alterar registros existentes. ReactQuill usa o mesmo endpoint e o frontend publica dimensões e lazy loading.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/MySQL, Sharp, Vitest e React DOM server rendering.

**Spec:** [2026-10-08-blog-image-optimization-design.md](../specs/2026-10-08-blog-image-optimization.md)

## Global Constraints

- Arquivo original máximo: 2 MB; backend verifica tamanho e tipo real.
- Converter uploads válidos para WebP; preservar transparência, orientação e proporção; retirar metadados.
- Alvos: banner 1920 × 1080, conteúdo 1200 px de largura, galeria 1200 × 1200, card 600 × 400; sem ampliar ou cortar.
- Manter imagens antigas e preservar o design atual do painel.
- Exibir somente `Otimizando imagem...` durante processamento.
- Não alterar imagens antigas automaticamente nem executar `db push` durante validação.

## Review Focus

- Bytes com MIME/extensão falsos ou conteúdo truncado: rejeitar sem gravar arquivo final.
- GIF animado, SVG e imagem com dimensões abusivas: rejeitar com erro controlado.
- Entrada transparente e EXIF rotacionada: preservar transparência e orientação no WebP.
- Erro entre escrita da variante principal e da miniatura: limpar ambas as saídas.
- Posts antigos sem miniatura: manter capa existente nos cards e manter layout/atributos de lazy loading.

---

### Task 1: Processador Sharp e endpoint seguro

**Files:**
- Create: `lib/image-optimization.ts`
- Modify: `app/api/admin/assets/route.ts`, `package.json`, `package-lock.json`
- Test: `lib/image-optimization.test.ts`, `app/api/admin/assets/route.test.ts`

**Interfaces:**
- Produces `optimizeImage(buffer: Buffer, destination: 'cover' | 'gallery' | 'content', originalSize: number): Promise<{ main: Buffer; width: number; height: number; thumbnail?: Buffer; thumbnailWidth?: number; thumbnailHeight?: number }>`.
- Endpoint retorna `asset.url`, `asset.width`, `asset.height`, e, para banner, `asset.thumbnailUrl`.

- [ ] Testar 2 MiB permitido, acima rejeitado, formato detectado nos bytes, WebP, alvo de dimensões, proporção, transparência, orientação e arquivo inválido.
- [ ] Executar os testes novos e observar falhas esperadas antes de implementar.
- [ ] Implementar allowlist de formatos estáticos e limite de pixels; compressão WebP a partir de qualidade 80; gravar com arquivo temporário e limpeza em falha.
- [ ] Testar autenticação, MIME falsificado, limite do endpoint e limpeza de arquivos de saída após erro.
- [ ] Executar novamente os testes e typecheck.

### Task 2: Integrar destinos no CMS, miniaturas e ReactQuill

**Files:**
- Modify: `components/admin/post-editor.tsx`, `prisma/schema.prisma`, `lib/cms.ts`, `lib/content.ts`
- Test: `components/admin/post-editor.test.tsx`, `lib/content.test.ts`

**Interfaces:**
- Consumes o endpoint da Task 1 com destinos `cover`, `gallery` e `content`.
- Persiste `imageCardPath` opcional no post; leitura pública usa `imageCardPath || imagePath`.

- [ ] Cobrir o estado de upload com a mensagem exata `Otimizando imagem...` e a associação de thumbnail aos cards.
- [ ] Implementar validação de tamanho no cliente, envio do destino, handler de imagem do ReactQuill, persistência da miniatura e fallback de posts antigos.
- [ ] Executar testes novos e typecheck; confirmar que nenhum controle de otimização foi adicionado.

### Task 3: Renderização pública e cobertura final

**Files:**
- Modify: `components/news-card.tsx`, `components/article-view.tsx`, `lib/content.ts`, `package.json`
- Test: `components/news-card.test.tsx`, `components/article-view.test.tsx`

- [ ] Cobrir miniatura de card, fallback legado, dimensões estáveis e lazy loading em imagens fora da primeira dobra; capa principal preserva prioridade de carregamento.
- [ ] Implementar dimensões e lazy loading para conteúdo/galeria mantendo o CSS e layout existentes.
- [ ] Executar todos os testes, `npm run typecheck`, `npm run build` e `git diff --check`; revisar o diff para preservar arquivos não relacionados.
