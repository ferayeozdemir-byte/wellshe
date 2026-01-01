// data/content.ts

export type CategoryId =
  | "healthyEating"
  | "relationships"
  | "wellbeing"
  | "sport"
  | "fashion"
  | "beauty"
  | "astrology"
  | "travel"
  | "home";

export type ArticleSection = {
  id: string;
  title: string;
  body: string;
  imageKey?: string; // burç görseli vs için
};

export type Article = {
  id: string;
  category: CategoryId;
  title: string;
  summary: string;
  body: string;
  date: string;
  mainImageKey?: string; // 🔹 YENİ EKLEDİK
  sections?: {
    id: string;
    title: string;
    body: string;
    imageKey?: string;
  }[];
};

export const articles: Article[] = [
  // 
];