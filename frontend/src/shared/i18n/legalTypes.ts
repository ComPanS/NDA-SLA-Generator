export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h6'; text: string }
  | { type: 'ul'; items: string[] };

export type LegalPage = {
  metaTitle: string;
  metaDescription: string;
  path: string;
  h1: string;
  blocks: LegalBlock[];
};

export type LegalBundle = {
  terms: LegalPage;
  privacy: LegalPage;
};
