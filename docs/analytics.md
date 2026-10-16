# Analytics próprio do Grupo +B

## Fonte e início dos dados

O painel usa somente eventos próprios que forem registrados depois da implantação e do consentimento analítico. Se ainda não houver visitas consentidas, o painel mostra zero e estados vazios.

O painel não depende de serviços de analytics externos; toda a coleta e agregação descritas aqui são próprias do site.

## Métricas

- **Visualizações de página:** número de eventos `page_view` recebidos para páginas públicas.
- **Visitantes únicos:** quantidade distinta de digests HMAC de identificadores aleatórios consentidos entre as visualizações do período. A estimativa é limitada a esse navegador, não conecta dispositivos e pode contar novamente após exclusão ou troca do cookie.
- **Tempo médio de permanência:** soma dos segundos engajados recebidos, dividida pelo número de visualizações de página no período. O navegador acumula tempo somente enquanto a página está visível e envia blocos de até 15 segundos. Fechamentos abruptos podem deixar de enviar o bloco parcial.
- **Publicações lidas:** visualizações com vínculo a uma publicação existente e publicada no momento do evento. O registro referencia o `Post` do CMS; não copia campos editoriais.

O coletor registra uma visualização por caminho público distinto durante a navegação da aplicação. Reenvios preservam o mesmo `eventId`; a restrição única no banco evita somar duas vezes o mesmo evento. Eventos `engagement` não contam como visualização.

## Datas e retenção

“Hoje” e os períodos de 7, 30 e 90 dias usam dias de calendário de `America/Sao_Paulo`. O intervalo SQL é semiaberto (`>= início` e `< fim`); no período personalizado, as datas inicial e final escolhidas são inclusivas. O intervalo personalizado admite no máximo 90 dias e não pode terminar no futuro.

Eventos fora dos 90 dias anteriores são excluídos das consultas mesmo antes da limpeza. Uma rotina no processo Node remove eventos expirados e registros de consentimento revogados ou inativos diariamente. O cookie de consentimento vence em 90 dias.

## Origem e dispositivo

A origem é classificada a partir do domínio de referência reduzido ao host e dos parâmetros `utm_source`/`utm_medium` permitidos. Identificadores de clique conhecidos permitem reconhecer busca paga. Domínios de buscadores conhecidos viram busca orgânica; domínios sociais conhecidos, redes sociais; referência HTTP(S) desconhecida, referências; campanhas não reconhecidas, outros; ausência de referência, direto. A atribuição de campanha é enviada apenas na primeira visualização observada pela aplicação naquela navegação.

O dispositivo é classificado no servidor em desktop, mobile ou tablet. O user-agent bruto não é persistido. Endereços IP, URL completa do referrer, digests e eventos individuais não são incluídos nas respostas das APIs administrativas.

## Consentimento e identificadores

Sem consentimento não é criado identificador nem evento. Após o aceite, o servidor emite UUID aleatório em cookie first-party `HttpOnly`, `SameSite=Lax` e `Secure` em produção. O banco recebe somente HMAC-SHA-256 do UUID, com `ANALYTICS_HMAC_SECRET` estável, nunca o UUID. O UUID não é conta autenticada nem impressão digital do navegador.

O modal de consentimento é renderizado globalmente por portal, fora do fluxo da página. O link “Preferências de cookies” no rodapé reabre as opções em qualquer rota pública. Fechar o modal não aceita nem recusa; a coleta continua bloqueada enquanto não existir decisão válida.

Cada ação explícita de aceitar ou recusar grava uma linha minimizada em `analytics_consent_decisions`, com UUID de idempotência da ação, escolha e data. O UUID não é ligado a visitante, conta, IP ou evento. Reenvio da mesma ação não soma outra decisão; a pessoa pode gerar outra decisão escolhendo novamente nas preferências. O painel chama essas contagens de “Decisões registradas”: elas não identificam nem comprovam pessoas únicas. A taxa de aceitação/recusa usa somente ações aceitas/recusadas no período; quem ainda não respondeu não compõe o total. As linhas expiram após 90 dias e seguem os filtros de período do Analytics.

A recusa bloqueia imediatamente novos eventos no navegador, inclusive lotes pendentes de tempo engajado. O pedido é sincronizado com a API; em falha de rede, a escolha de recusa e o mesmo UUID ficam em armazenamento local, quando disponível, para bloquear a coleta e tentar novamente, sem contar até a gravação do servidor. A recusa não recebe cookie de visitante. Alterar de aceite para recusa invalida o cookie e digest ativos e remove os eventos relacionados em transação. Uma nova autorização usa identificador aleatório novo.

## Configuração operacional

Defina `ANALYTICS_HMAC_SECRET` como um segredo aleatório de pelo menos 32 bytes no ambiente do servidor. O mesmo valor deve permanecer estável entre reinícios e réplicas e ser fornecido pelo responsável do deploy em `web.env.production`. Não coloque o valor em controle de versão, documentação ou logs. Sem o segredo, a coleta fica indisponível e o painel não recebe eventos novos.

A migration `20261009180000_analytics_events` é aditiva: cria eventos, estado mínimo de consentimento, índices e a permissão administrativa Analytics. Ela habilita a nova permissão para contas existentes com papel `ADMINISTRATOR` e para usuários que já tinham as três permissões administrativas, preservando o conceito existente de acesso completo.
