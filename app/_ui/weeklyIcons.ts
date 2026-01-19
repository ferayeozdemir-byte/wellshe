export const WEEKLY_ICONS = {
  section: require("../../assets/icons/weekly/spark.png"),
  movie: require("../../assets/icons/weekly/movie.png"),
  book: require("../../assets/icons/weekly/book.png"),
  music: require("../../assets/icons/weekly/music.png"),
} as const;

export type WeeklyIconKey = keyof typeof WEEKLY_ICONS;

export default {};
