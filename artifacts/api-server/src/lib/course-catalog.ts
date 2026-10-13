export const COURSE_CATALOG = {
  crm: {
    title: "Estágio Formativo em CRM",
    description: "Desenvolva competências práticas para gerir relações com clientes, acompanhar oportunidades e apoiar equipas comerciais.",
    duration: "3 meses",
    priceKz: 100_000,
    imageUrl: "/images/courses/crm.jpg",
  },
  tesouraria: {
    title: "Estágio Formativo em Tesouraria",
    description: "Aprenda rotinas de tesouraria, registos financeiros, controlo de caixa e organização de documentos.",
    duration: "3 meses",
    priceKz: 100_000,
    imageUrl: "/images/courses/tesouraria.jpg",
  },
  "lideranca-equipas": {
    title: "Liderança e Gestão de Equipas",
    description: "Pratique liderança, comunicação, organização de equipas e acompanhamento de resultados.",
    duration: "3 meses",
    priceKz: 100_000,
    imageUrl: "/images/courses/lideranca-equipas.jpg",
  },
  "gestao-comercial": {
    title: "Estágio Formativo em Gestão Comercial",
    description: "Desenvolva competências de vendas, gestão comercial e acompanhamento de clientes.",
    duration: "3 meses",
    priceKz: 100_000,
    imageUrl: "/images/courses/gestao-comercial.jpg",
  },
  "gestao-empresas": {
    title: "Gestão e Administração de Empresas",
    description: "Aprenda a planear, organizar e acompanhar as principais atividades de uma empresa.",
    duration: "3 meses",
    priceKz: 100_000,
    imageUrl: "/images/courses/gestao-empresas.jpg",
  },
  "recursos-humanos": {
    title: "Gestão de Recursos Humanos",
    description: "Conheça processos de gestão de pessoas, recrutamento e apoio às rotinas de recursos humanos.",
    duration: "3 meses",
    priceKz: 100_000,
    imageUrl: "/images/courses/recursos-humanos.jpg",
  },
} as const;

export type CourseId = keyof typeof COURSE_CATALOG;
