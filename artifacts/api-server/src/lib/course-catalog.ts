export const COURSE_CATALOG = {
  crm: {
    title: "Estágio Formativo em CRM",
    priceKz: 100_000,
  },
  tesouraria: {
    title: "Estágio Formativo em Tesouraria",
    priceKz: 100_000,
  },
  "lideranca-equipas": {
    title: "Liderança e Gestão de Equipas",
    priceKz: 100_000,
  },
  "gestao-comercial": {
    title: "Estágio Formativo em Gestão Comercial",
    priceKz: 100_000,
  },
  "gestao-empresas": {
    title: "Gestão e Administração de Empresas",
    priceKz: 100_000,
  },
  "recursos-humanos": {
    title: "Gestão de Recursos Humanos",
    priceKz: 100_000,
  },
} as const;

export type CourseId = keyof typeof COURSE_CATALOG;
