'use client';

import { Minus, Plus } from 'lucide-react';
import React, { useState } from 'react';

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs: [string, React.ReactNode][] = [
    [
      'Como cadastrar minha empresa como fornecedora?',
      <>Você pode enviar os dados básicos de sua empresa e portfólio de produtos para o e-mail <a href="mailto:comercial@grupomaisbarato.com.br">comercial@grupomaisbarato.com.br</a>. Nossa equipe comercial de compras fará a triagem inicial.</>,
    ],
    [
      'O Grupo Mais Barato oferece vagas de emprego para quais áreas?',
      <>Temos oportunidades constantes em diversas áreas, incluindo operação de supermercado, farmácia, administrativo, TI, logística e posições gerenciais. Cadastre seu interesse pelo nosso Portal de Talentos — <a href="https://grupomaisbarato.portaldetalentos.senior.com.br/" target="_blank" rel="noopener noreferrer">https://grupomaisbarato.portaldetalentos.senior.com.br/</a></>,
    ],
    ['Onde ficam localizadas as sedes e centros de distribuição?', 'Nossas unidades e escritórios administrativos estão concentrados em Belém do Pará, com forte infraestrutura logística integrada para abastecer todas as nossas marcas de forma rápida e eficiente.'],
    ['Como posso entrar em contato com a Ouvidoria do Grupo?', <>Para denúncias, reclamações, sugestões ou elogios de forma confidencial, disponibilizamos a nossa Ouvidoria através do e-mail <a href="mailto:ouvidoria@grupomaisb.com.br">ouvidoria@grupomaisb.com.br</a>.</>],
  ];

  return <section className="section section-light faq-gold-section section-full-width" id="faq-secao"><div className="container faq-container"><div className="faq-grid"><div className="faq-content-col"><span className="eyebrow-gold">DÚVIDAS FREQUENTES</span><h2 className="faq-headline">Tire suas <span className="headline-highlight-italic">dúvidas</span></h2><div className="gold-accent-line" /></div><div className="faq-accordion-col"><div className="faq-accordion-list">{faqs.map(([question, answer], index) => <div className={`faq-card-item ${openFaq === index ? 'active' : ''}`} key={question}><button type="button" className="faq-card-question" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`}><span>{question}</span><span className="faq-plus-icon" aria-hidden="true">{openFaq === index ? <Minus size={19} /> : <Plus size={19} />}</span></button><div className="faq-card-answer" id={`faq-answer-${index}`}><div className="faq-card-answer-inner">{answer}</div></div></div>)}</div></div></div></div></section>;
}

