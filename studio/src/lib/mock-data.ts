import type { Candidate } from './types';

// This data is now for reference purposes only, as the app is connected to Firebase.
export const initialCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Ana Silva',
    cpf: '123.456.789-01',
    email: 'ana.silva@example.com',
    phone: '(11) 98765-4321',
    description: 'Candidata proativa com mais de 5 anos de experiência em gerenciamento de projetos. Excelente comunicação e habilidades de liderança. Referências disponíveis mediante solicitação.',
    statusHistory: [
      { status: 'Em Triagem', date: new Date(2023, 10, 1).toISOString(), notes: 'Candidata com bom fit para a vaga, currículo bem estruturado.' },
      { status: 'Entrevista', date: new Date(2023, 10, 5).toISOString(), notes: 'Demonstrou excelente comunicação e conhecimento técnico durante a entrevista com o RH.' },
      { status: 'Teste Técnico', date: new Date(2023, 10, 10).toISOString(), notes: 'Obteve pontuação máxima no teste técnico, demonstrando grande domínio das ferramentas.' },
      { status: 'Oferta', date: new Date(2023, 10, 15).toISOString(), notes: 'Proposta enviada e bem recebida pela candidata.' },
      { status: 'Contratado', date: new Date(2023, 10, 20).toISOString(), notes: 'Candidata aceitou a proposta. Início agendado para o próximo mês.' },
    ],
  },
  {
    id: '2',
    name: 'Bruno Costa',
    cpf: '234.567.890-12',
    email: 'bruno.costa@example.com',
    phone: '(21) 91234-5678',
    description: 'Desenvolvedor Full-Stack com foco em tecnologias JavaScript. Busca novos desafios em um ambiente dinâmico.',
    statusHistory: [
      { status: 'Em Triagem', date: new Date(2023, 11, 2).toISOString(), notes: 'Currículo interessante, mas com pouca experiência na tecnologia X.' },
      { status: 'Entrevista', date: new Date(2023, 11, 6).toISOString(), notes: 'Boa comunicação, porém não demonstrou a profundidade técnica necessária para a posição sênior.' },
      { status: 'Rejeitado', date: new Date(2023, 11, 7).toISOString(), notes: 'Candidato não avançou por não possuir os requisitos técnicos essenciais para a vaga. Manter no radar para posições júnior/pleno.' },
    ],
  },
  {
    id: '3',
    name: 'Carla Dias',
    cpf: '345.678.901-23',
    email: 'carla.dias@example.com',
    phone: '(31) 95678-1234',
    description: 'Designer de UI/UX com portfólio robusto e experiência em aplicativos móveis.',
    statusHistory: [
      { status: 'Em Triagem', date: new Date(2024, 0, 10).toISOString(), notes: 'Portfólio impressionante.' },
      { status: 'Entrevista', date: new Date(2024, 0, 15).toISOString(), notes: 'Ótima apresentação do case e bom fit cultural.' },
      { status: 'Teste Técnico', date: new Date(2024, 0, 20).toISOString(), notes: 'Aguardando entrega do teste técnico.' },
    ],
  },
  {
    id: '4',
    name: 'Daniel Martins',
    cpf: '456.789.012-34',
    email: 'daniel.martins@example.com',
    phone: '(41) 98765-4321',
    description: 'Recém-formado em Análise e Desenvolvimento de Sistemas, com grande interesse em segurança da informação.',
    statusHistory: [
      { status: 'Em Triagem', date: new Date(2024, 1, 5).toISOString(), notes: 'Candidato júnior, para triagem inicial.' },
    ],
  },
];
