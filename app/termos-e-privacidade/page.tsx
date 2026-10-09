import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Calendar,
  Clock,
  Shield,
  Cookie,
  Users,
  CheckCircle2,
  XCircle,
  Home,
  Mail,
  MapPin,
  Lock,
} from 'lucide-react';
import { PrintButton } from '../../components/print-button';

export const metadata: Metadata = {
  title: 'Política de Privacidade & Termos de Uso',
  description:
    'Consulte a Política de Privacidade e os Termos e Condições de Uso oficiais do Grupo Mais Barato. Conheça nossas diretrizes de proteção de dados, conformidade com a LGPD e termos de navegação.',
};

export default function TermosEPrivacidadePage() {
  return (
    <main id="wf-main-content" className="legal-page-wrapper">
      {/* ── Hero Legal com Breadcrumbs & Título ── */}
      <header className="legal-hero">
        <div className="container">
          {/* Breadcrumbs */}
          <nav className="legal-breadcrumbs" aria-label="Trilha de navegação">
            <Link href="/">
              <Home size={14} aria-hidden="true" />
              <span>Início</span>
            </Link>
            <span className="separator" aria-hidden="true">/</span>
            <span className="current" aria-current="page">Termos & Privacidade</span>
          </nav>

          {/* Badge Oficial */}
          <div>
            <div className="legal-hero-badge">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Documento Oficial & Diretrizes</span>
            </div>
          </div>

          <h1 className="legal-hero-title">
            Política de Privacidade <span className="title-amp">&</span> Termos de Uso
          </h1>
          <p className="legal-hero-desc">
            Grupo Mais Barato — Transparência, segurança e respeito aos seus dados e direitos em todas as nossas empresas, unidades físicas e plataformas digitais.
          </p>

          {/* Barra de Metadados e Impressão */}
          <div className="legal-meta-bar">
            <div className="legal-meta-item">
              <Calendar size={14} aria-hidden="true" />
              <span>Efetiva a partir de <strong>04 de Setembro de 2026</strong></span>
            </div>
            <div className="legal-meta-item">
              <Clock size={14} aria-hidden="true" />
              <span>Tempo de leitura: <strong>~5 min</strong></span>
            </div>
            <div className="legal-meta-item">
              <Shield size={14} aria-hidden="true" />
              <span>Conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong></span>
            </div>
            <PrintButton />
          </div>
        </div>
      </header>

      {/* ── Container Central do Documento (Clean Card) ── */}
      <div className="legal-content-wrapper">
        <div className="container">
          <article className="legal-document-card">
            {/* ==============================================================
                 SEÇÃO 1: POLÍTICA DE PRIVACIDADE
                 ============================================================== */}
            <section id="privacidade" className="legal-section" aria-labelledby="heading-privacidade">
              <div className="legal-block-header">
                <div className="legal-block-icon">
                  <ShieldCheck size={28} aria-hidden="true" />
                </div>
                <div className="legal-block-info">
                  <h2 id="heading-privacidade">Política de Privacidade</h2>
                  <p>Diretrizes de coleta, tratamento, armazenamento e segurança das informações</p>
                </div>
              </div>

              {/* Introdução */}
              <div className="legal-clause">
                <p className="legal-text">
                  A sua privacidade é fundamental para nós. É compromisso do <strong>Grupo Mais Barato (Grupo +B)</strong> respeitar e resguardar a privacidade de clientes, parceiros, colaboradores, fornecedores e visitantes em relação a qualquer informação pessoal que possamos coletar através do nosso portal institucional, portais de marcas coligadas (+B Supermercados, +B Farma, The Wine Experience, Vila Plaza Restaurante e Parque), canais oficiais de comunicação e atendimento ao cliente.
                </p>
              </div>

              {/* Cláusula 1 */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">1</span>
                  Coleta com Consentimento, Finalidade e Transparência
                </h3>
                <p className="legal-text">
                  Solicitamos informações pessoais (como nome, CPF, número de telefone/WhatsApp, e-mail e currículo profissional) apenas quando estritamente necessárias para a prestação dos nossos serviços, inclusão em programas de benefícios e fidelidade, emissão de comprovantes fiscais conforme exigência legal, atendimento a solicitações de suporte ou participação em processos seletivos em nosso portal de carreiras.
                </p>
                <p className="legal-text">
                  A coleta de dados é realizada sempre por meios justos, legais e com o seu consentimento prévio ou sob as bases legais expressamente autorizadas pela <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei Federal nº 13.709/2018)</strong>. Informamos de maneira clara e transparente o motivo pelo qual as informações são coletadas e como serão empregadas.
                </p>
              </div>

              {/* Cláusula 2 */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">2</span>
                  Retenção, Guarda e Segurança da Informação
                </h3>
                <p className="legal-text">
                  Mantemos os dados pessoais coletados apenas pelo período necessário para cumprir com as finalidades para as quais foram coletados ou para atendimento de obrigações legais, regulatórias, fiscais e contratuais.
                </p>
                <p className="legal-text">
                  Adotamos padrões rigorosos e comercialmente aceitáveis de segurança da informação para prevenir perdas, vazamentos, furtos, bem como acesso, divulgação, cópia, utilização ou alteração não autorizados, empregando criptografia HTTPS/TLS, firewalls, controle restrito de credenciais e monitoramento permanente de nossas infraestruturas digitais.
                </p>
              </div>

              {/* Cláusula 3 */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">3</span>
                  Não Comercialização e Compartilhamento Restrito
                </h3>
                <p className="legal-text">
                  O <strong>Grupo Mais Barato</strong> não vende, não aluga e não comercializa dados de identificação pessoal sob nenhuma circunstância.
                </p>
                <p className="legal-text">
                  O compartilhamento de dados poderá ocorrer de forma controlada e restrita exclusivamente com: (a) empresas controladas e coligadas ao Grupo Mais Barato para integração de benefícios; (b) prestadores de serviços de tecnologia essenciais à operação dos sistemas (provedores de hospedagem, gateways de pagamento e ferramentas de gestão); e (c) autoridades policiais, regulatórias ou judiciais, unicamente mediante ordem formal ou determinação legal.
                </p>
              </div>

              {/* Cláusula 4 */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">4</span>
                  Links para Plataformas e Serviços de Terceiros
                </h3>
                <p className="legal-text">
                  Nosso portal institucional pode conter links para sites e serviços externos (tais como portais de talentos e vagas, canais de redes sociais, Google Maps e aplicativos de parceiros).
                </p>
                <p className="legal-text">
                  Esclarecemos que não exercemos controle sobre as práticas de privacidade de terceiros e não assumimos responsabilidade pelas diretrizes adotadas por plataformas externas. Recomendamos que você leia atentamente as políticas de privacidade desses respectivos serviços antes de submeter dados pessoais.
                </p>
              </div>

              {/* Cláusula 5 */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">5</span>
                  Direitos do Titular de Dados Pessoais (Artigo 18 da LGPD)
                </h3>
                <p className="legal-text">
                  Você é livre para recusar a concessão de dados pessoais, compreendendo que essa escolha poderá limitar o fornecimento de determinados serviços ou funcionalidades personalizadas.
                </p>
                <p className="legal-text">
                  Em conformidade com a LGPD, você possui o direito de solicitar a qualquer tempo: (a) confirmação da existência de tratamento; (b) acesso facilitado aos seus dados; (c) correção de dados incompletos, inexatos ou desatualizados; (d) anonimização, bloqueio ou eliminação de dados desnecessários; (e) portabilidade de informações; e (f) revogação do consentimento concedido.
                </p>
              </div>

              {/* Cláusula 6 */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">6</span>
                  Cookies e Métricas de Navegação
                </h3>
                <div className="legal-callout-box">
                  <div className="legal-callout-title">
                    <Cookie size={18} aria-hidden="true" />
                    <span>Uso de Cookies Essenciais e Analíticos</span>
                  </div>
                  <p>
                    A coleta analítica própria só começa após seu aceite. Com ele, usamos um identificador aleatório guardado em cookie first-party HttpOnly e armazenamos apenas seu HMAC, sem IP, user-agent bruto ou URL completa de referência. Registramos páginas públicas, domínio de origem, classe de dispositivo e segundos em que a página permanece visível. Os eventos detalhados são removidos após 90 dias. O identificador não representa uma conta nem identifica diretamente uma pessoa.
                  </p>
                </div>

                <div className="legal-callout-box">
                  <div className="legal-callout-title">
                    <Users size={18} aria-hidden="true" />
                    <span>Gerenciamento no Navegador</span>
                  </div>
                  <p>
                    Você pode recusar o uso de métricas ou reabrir as preferências pelo link “Preferências de cookies” no rodapé. A revogação interrompe novas coletas e apaga os eventos associados ao identificador. Cookies essenciais continuam ativos para segurança e funcionamento do portal; bloquear cookies técnicos no navegador pode afetar funcionalidades do site.
                  </p>
                </div>
              </div>

              {/* Cláusula 7 */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">7</span>
                  Compromisso Ético e Condutas Vedadas
                </h3>
                <p className="legal-text">
                  Ao navegar em nossas plataformas digitais, o usuário compromete-se a utilizar os recursos de forma adequada, responsável e em conformidade com as leis em vigor, abstendo-se de:
                </p>

                <div className="legal-commit-list">
                  <div className="legal-commit-item">
                    <span className="legal-commit-letter">A</span>
                    <div className="legal-commit-desc">
                      <strong>Legalidade e Ética:</strong> Praticar quaisquer atividades de cunho ilícito, fraudulento ou contrárias à boa-fé e à ordem pública;
                    </div>
                  </div>
                  <div className="legal-commit-item">
                    <span className="legal-commit-letter">B</span>
                    <div className="legal-commit-desc">
                      <strong>Respeito à Diversidade:</strong> Difundir conteúdos difamatórios, discriminatórios, racistas, xenofóbicos ou que violem os direitos humanos;
                    </div>
                  </div>
                  <div className="legal-commit-item">
                    <span className="legal-commit-letter">C</span>
                    <div className="legal-commit-desc">
                      <strong>Integridade Cibernética:</strong> Provocar danos aos sistemas de informação do Grupo Mais Barato ou de parceiros por meio de vírus, códigos maliciosos ou tentativas de invasão e sobrecarga de servidores.
                    </div>
                  </div>
                </div>
              </div>

              {/* Cláusula 8 */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">8</span>
                  Canal de Atendimento do DPO / Encarregado de Dados
                </h3>
                <p className="legal-text">
                  Para exercer seus direitos de titular, tirar dúvidas a respeito do tratamento de dados ou enviar manifestações relativas à privacidade, entre em contato direto com o nosso canal oficial de governança:
                </p>

                <div className="legal-dpo-box">
                  <div className="legal-dpo-header">
                    <Lock size={20} aria-hidden="true" />
                    <h4>Encarregado de Proteção de Dados (DPO)</h4>
                  </div>
                  <div className="legal-dpo-grid">
                    <div className="legal-dpo-card">
                      <Mail size={16} aria-hidden="true" />
                      <span>E-mail dedicado: <strong>privacidade@grupomaisbarato.com.br</strong></span>
                    </div>
                    <div className="legal-dpo-card">
                      <MapPin size={16} aria-hidden="true" />
                      <span>Sede Corporativa: <strong>Belém – PA, Brasil</strong></span>
                    </div>
                  </div>
                </div>

                <div className="legal-effective-badge">
                  <div className="legal-effective-text">
                    <CheckCircle2 size={20} aria-hidden="true" />
                    <span>Política em vigor e efetiva a partir de:</span>
                  </div>
                  <div className="legal-effective-date">
                    04 de Setembro de 2026
                  </div>
                </div>
              </div>
            </section>

            {/* Divisor Estilizado Dourado */}
            <div className="legal-section-divider" />

            {/* ==============================================================
                 SEÇÃO 2: TERMOS E CONDIÇÕES DE USO
                 ============================================================== */}
            <section id="termos" className="legal-section" aria-labelledby="heading-termos">
              <div className="legal-block-header">
                <div className="legal-block-icon">
                  <FileText size={28} aria-hidden="true" />
                </div>
                <div className="legal-block-info">
                  <h2 id="heading-termos">Termos e Condições de Uso</h2>
                  <p>Diretrizes de navegação, licença de uso, disponibilidade e responsabilidades</p>
                </div>
              </div>

              {/* 1. Aceitação */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">1</span>
                  Aceitação dos Termos
                </h3>
                <p className="legal-text">
                  Ao navegar pelo portal institucional do <strong>Grupo Mais Barato</strong> e por suas páginas de marcas parceiras, você concorda expressamente com as disposições destes Termos e Condições de Uso e com todas as leis e regulamentos aplicáveis. Caso discorde de qualquer um dos termos aqui apresentados, solicitamos que suspenda o uso de nossas plataformas digitais.
                </p>
              </div>

              {/* 2. Licença de Uso */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">2</span>
                  Licença de Uso e Propriedade Intelectual
                </h3>
                <p className="legal-text">
                  É concedida ao visitante uma permissão temporária, intransferível e não exclusiva para visualizar e consultar os materiais informativos veiculados no site do <strong>Grupo Mais Barato</strong>, unicamente para fins pessoais e não comerciais.
                </p>
                <p className="legal-text">
                  Esta autorização constitui uma concessão de licença de acesso, não uma cessão de titularidade de direitos. Sob esta licença, é expressamente proibido:
                </p>

                <ul className="legal-restriction-list">
                  <li className="legal-restriction-item">
                    <XCircle size={18} aria-hidden="true" />
                    <span>Modificar, descaracterizar ou criar obras derivadas a partir dos materiais e identidades visuais do Grupo;</span>
                  </li>
                  <li className="legal-restriction-item">
                    <XCircle size={18} aria-hidden="true" />
                    <span>Utilizar logotipos, marcas registradas (+B Supermercados, +B Farma, The Wine Experience, Vila Plaza) para finalidades comerciais sem expressa autorização por escrito;</span>
                  </li>
                  <li className="legal-restriction-item">
                    <XCircle size={18} aria-hidden="true" />
                    <span>Realizar engenharia reversa, descompilar códigos ou tentar obter acesso não autorizado aos sistemas operacionais;</span>
                  </li>
                  <li className="legal-restriction-item">
                    <XCircle size={18} aria-hidden="true" />
                    <span>Remover avisos de direitos autorais ou símbolos de propriedade intelectual contidos nas publicações;</span>
                  </li>
                  <li className="legal-restriction-item">
                    <XCircle size={18} aria-hidden="true" />
                    <span>Espelhar ou clonar as páginas e conteúdos em servidores ou plataformas de terceiros.</span>
                  </li>
                </ul>
              </div>

              {/* 3. Isenção */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">3</span>
                  Isenção de Responsabilidade
                </h3>
                <p className="legal-text">
                  Os conteúdos e materiais disponibilizados neste portal são oferecidos &ldquo;no estado em que se encontram&rdquo;. O <strong>Grupo Mais Barato</strong> empenha esforços permanentes para assegurar a veracidade e a atualização contínua de suas publicações, endereços de lojas e notícias corporativas. Todavia, oscilações operacionais de rede ou instabilidades técnicas de provedores podem eventualmente acontecer.
                </p>
              </div>

              {/* 4. Limitações */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">4</span>
                  Limitações de Responsabilidade
                </h3>
                <p className="legal-text">
                  Em hipótese alguma o <strong>Grupo Mais Barato</strong>, seus diretores, colaboradores ou parceiros serão responsabilizados por quaisquer perdas financeiras, interrupções de negócios ou prejuízos indiretos decorrentes da inoperância de conexões de terceiros ou falhas nos navegadores dos usuários.
                </p>
              </div>

              {/* 5. Informações e Vagas */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">5</span>
                  Precisão das Informações Institucionais e Vagas
                </h3>
                <p className="legal-text">
                  As publicações corporativas, informes institucionais e anúncios de vagas podem sofrer alterações a qualquer momento para acompanhar a evolução das operações do Grupo. O Grupo reserva-se o direito de atualizar tais informações sem aviso prévio. O canal oficial para envio e candidatura de currículos é o portal de carreiras parceiro indicado no menu Trabalhe Conosco.
                </p>
              </div>

              {/* 6. Links de Terceiros */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">6</span>
                  Links para Ambientes Parceiros
                </h3>
                <p className="legal-text">
                  O portal do Grupo Mais Barato pode incluir links que redirecionam para plataformas de parceiros e redes sociais externas. O direcionamento tem propósito meramente informativo, não implicando responsabilidade solidária quanto às políticas e termos praticados por terceiros.
                </p>
              </div>

              {/* 7. Revisões */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">7</span>
                  Revisões e Alterações dos Termos
                </h3>
                <p className="legal-text">
                  O <strong>Grupo Mais Barato</strong> poderá revisar estes Termos e Condições de Uso a qualquer momento, conforme exigências regulatórias ou aprimoramentos operacionais. Ao continuar utilizando nossas páginas digitais após alterações, você concorda em sujeitar-se à versão vigente do documento.
                </p>
              </div>

              {/* 8. Foro */}
              <div className="legal-clause">
                <h3 className="legal-clause-title">
                  <span className="legal-clause-badge">8</span>
                  Legislação Aplicável e Foro de Eleição
                </h3>
                <p className="legal-text">
                  Estes Termos são integralmente regidos pelas leis vigentes na <strong>República Federativa do Brasil</strong>.
                </p>
                <p className="legal-text">
                  Fica expressamente eleito o foro da <strong>Comarca de Belém, Estado do Pará</strong>, com renúncia irrevogável a qualquer outro, por mais privilegiado que seja, para solucionar eventuais controvérsias decorrentes da interpretação ou aplicação destes termos.
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
