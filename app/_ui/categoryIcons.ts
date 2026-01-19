// app/_ui/categoryIcons.ts
export const CATEGORY_ICONS = {
  healthyEating: require("../../assets/icons/categories/healthyEating.png"),
  relationships: require("../../assets/icons/categories/relationships.png"),
  wellbeing: require("../../assets/icons/categories/wellbeing.png"),
  sport: require("../../assets/icons/categories/sport.png"),
  fashion: require("../../assets/icons/categories/fashion.png"),
  beauty: require("../../assets/icons/categories/beauty.png"),
  astrology: require("../../assets/icons/categories/astrology.png"),
  travel: require("../../assets/icons/categories/travel.png"),
  home: require("../../assets/icons/categories/home.png"),
} as const;

export type CategoryKey = keyof typeof CATEGORY_ICONS;

export default {};
