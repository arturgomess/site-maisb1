import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const posts = [
  {
    slug: 'grupo-mais-barato-celebra-10-anos-expansao-varejo-paraense',
    title: 'Grupo Mais Barato celebra 10 anos de expansão e inovação no varejo paraense',
    category: 'Institucional',
    publishedAt: new Date('2026-08-20T12:00:00-03:00'),
    excerpt: 'Com mais de 10 mil metros quadrados de área operacional e 5 marcas consolidadas, o Grupo reafirma seu compromisso com Belém e com a geração de oportunidades.',
    author: 'Assessoria de Comunicação Grupo +B',
    bodyHtml: '<p>Desde a sua fundação em 2015, o Grupo Mais Barato tem sido sinônimo de pioneirismo, respeito às pessoas e compromisso inegociável com a qualidade. O que começou como uma visão de transformar o varejo local hoje se consolida como um dos ecossistemas de marcas mais integrados da Região Norte.</p><h2>Um ecossistema multissetorial completo</h2><p>Hoje, o ecossistema abrange os Supermercados +B, a rede de farmácias +B Farma, os espaços de conveniência e lazer Villa Plaza e Villa Plaza Park, além da boutique refinada The Wine Experience. Essa sinergia permite atender os clientes em todas as suas necessidades diárias com máxima excelência.</p><blockquote>“Mais do que crescer, nosso propósito sempre foi transformar relações e construir um futuro sustentável para as comunidades onde estamos inseridos.”</blockquote><p>Os próximos anos trarão investimentos contínuos em tecnologia, infraestrutura logística e capacitação de colaboradores, mantendo Belém no centro do nosso coração e dos nossos negócios.</p>',
    status: 'published',
    seoTitle: 'Grupo Mais Barato celebra 10 anos no varejo paraense',
    seoDescription: 'Grupo Mais Barato celebra uma década de expansão, inovação e compromisso com Belém e com o varejo paraense.',
    imagePath: '/assets/Fotografias/Grupo Institucional +B/foto-grupo-b-em-fente-fachada_pessoas.webp',
    imageAlt: 'Equipe do Grupo Mais Barato em frente à unidade',
    imageCaption: 'Fachada e equipe do Grupo Mais Barato',
  },
  {
    slug: 'the-wine-experience-apresenta-selecao-exclusiva-de-rotulos',
    title: 'The Wine Experience apresenta seleção exclusiva de rótulos internacionais para o segundo semestre',
    category: 'The Wine Experience',
    publishedAt: new Date('2026-08-15T12:00:00-03:00'),
    excerpt: 'Adega premium traz safras consagradas de vinícolas do Chile, Argentina, França e Itália com atendimento especializado.',
    author: 'Grupo Mais Barato',
    bodyHtml: '<p>A The Wine Experience amplia a curadoria de rótulos e experiências para quem aprecia bons vinhos.</p>',
    status: 'published',
    imagePath: '/assets/Fotografias/The Wine Experience/salao-principal-clientes.webp',
    imageAlt: 'Equipe da The Wine Experience',
  },
  {
    slug: 'mais-b-supermercados-expande-setor-de-carnes-nobres',
    title: '+B Supermercados expande setor de carnes nobres e hortifrúti selecionado na unidade Alcindo Cacela',
    category: '+B Supermercados',
    publishedAt: new Date('2026-08-10T12:00:00-03:00'),
    excerpt: 'Novos balcões climatizados, cortes especiais com padrão gourmet e hortifrúti abastecido diariamente.',
    author: 'Grupo Mais Barato',
    bodyHtml: '<p>A expansão reforça o compromisso com qualidade, variedade e proximidade.</p>',
    status: 'published',
    imagePath: '/assets/Fotografias/Supermercado +B/00_CardHome/4-supemercado.webp',
    imageAlt: 'Setor de carnes do supermercado +B',
  },
  {
    slug: 'mais-b-farma-inaugura-programa-atencao-farmaceutica',
    title: '+B Farma inaugura programa de atenção farmacêutica com aferições e orientações gratuitas',
    category: '+B Farma',
    publishedAt: new Date('2026-08-01T12:00:00-03:00'),
    excerpt: 'Iniciativa reforça o cuidado integral com a saúde e o bem-estar da família paraense com farmacêuticos presentes em tempo integral.',
    author: 'Grupo Mais Barato',
    bodyHtml: '<p>A iniciativa reforça o cuidado integral com a saúde e o bem-estar das famílias paraenses.</p>',
    status: 'published',
    imagePath: '/assets/Fotografias/Mais B Farma/foto-farma-b (1).webp',
    imageAlt: 'Atendimento na +B Farma',
  },
  {
    slug: 'villa-plaza-park-anuncia-programacao-cultural-lazer-gastronomia',
    title: 'Villa Plaza Park anuncia programação cultural de lazer e gastronomia para os finais de semana',
    category: 'Villa Plaza',
    publishedAt: new Date('2026-07-28T12:00:00-03:00'),
    excerpt: 'Música ao vivo, espaço kids seguro, food park e ambientes instagramáveis fazem do complexo o ponto de encontro favorito na região.',
    author: 'Grupo Mais Barato',
    bodyHtml: '<p>O Villa Plaza Park reúne diversão, gastronomia e experiências para toda a família.</p>',
    status: 'published',
    imagePath: '/assets/Fotografias/Villa Plaza (Park Infantil)/villa-plaza-park-tapana.webp',
    imageAlt: 'Área infantil do Villa Plaza Park',
  },
];

await prisma.$transaction(async (transaction) => {
  for (const post of posts) {
    await transaction.post.upsert({ where: { slug: post.slug }, update: post, create: post });
  }
  await transaction.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: 'Grupo Mais Barato',
      defaultTitle: 'Grupo Mais Barato | Varejo, cuidado e experiências',
      defaultDescription: 'O Grupo Mais Barato reúne negócios que fazem parte do dia a dia das pessoas de Belém-PA.',
      defaultKeywords: JSON.stringify(['Grupo Mais Barato', 'Grupo +B', 'Belém', 'varejo paraense']),
      robotsIndex: true,
    },
  });
});

console.log(`Seed concluído: ${posts.length} posts.`);
await prisma.$disconnect();
