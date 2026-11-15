// Textos EN/PT da pré-checagem. Cada texto é um par { en, pt } para o seletor de idioma ligar depois:
// basta passar o idioma escolhido como `lang` para os componentes de components/FarmPrecheck.tsx.
export type Lang = "en" | "pt";
export type Tx = { en: string; pt: string };

// Inglês é o padrão pedido pelo Space Apps; trocar aqui ou passar `lang` nos componentes.
export const DEFAULT_LANG: Lang = "en";

export const tx = (t: Tx, lang: Lang) => t[lang];

export const fmtInt = (n: number, lang: Lang) => n.toLocaleString(lang === "pt" ? "pt-BR" : "en-US");
