// lib/articleImages.ts
import { ImageSourcePropType } from "react-native";

// ✅ Local görsel map'i: dinamik require olmaz, burası şart.
// Key'i: article.imageKey (önerilen) ya da article.id kullanabilirsiniz.
export const ARTICLE_IMAGE_MAP: Record<string, ImageSourcePropType> = {
  // ÖRNEKLER — sizdeki dosya adlarıyla doldurun:
  // "healthy-eating-1": require("../assets/images/articles/healthy-eating-1.jpg"),
  // "rel-1": require("../assets/images/articles/rel-1.png"),
};

// ✅ Remote varsa uri döndür, yoksa local map'ten require döndür.
export function resolveArticleImage(article: {
  imageUrl?: string | null;   // remote full url
  imageKey?: string | null;   // local key
  id?: string;
}): ImageSourcePropType | undefined {
  const remote = article.imageUrl?.trim();
  if (remote) return { uri: remote };

  const key = (article.imageKey || article.id || "").trim();
  if (!key) return undefined;

  return ARTICLE_IMAGE_MAP[key];
}
