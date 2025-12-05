/**
 * Extracts the release year from a movie object with high accuracy.
 * Priority:
 * 1. explicit 'year' field
 * 2. 'category' like "Năm 2024" or "2023"
 * 3. publish_date / release_date
 * 4. Regex match in title / slug / origin_name
 * 5. created_time (last resort for new movies)
 * 6. updated_time (very last resort, often unreliable)
 */
export const getMovieYear = (movie) => {
  if (!movie) return '';

  // 1. Explicit year field (if valid 4-digit)
  if (movie.year && /^\d{4}$/.test(String(movie.year))) {
    return String(movie.year);
  }

  // Helper to parse date string
  const getYearFromDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : String(date.getFullYear());
  };

  // 2. Check categories for "Năm YYYY" or just "YYYY"
  if (movie.category && Array.isArray(movie.category)) {
    // Priority: Category with "Năm \d{4}"
    const yearCat = movie.category.find(cat => cat.name && /(?:Năm\s+)?(\d{4})/.test(cat.name));
    if (yearCat) {
      const match = yearCat.name.match(/(?:Năm\s+)?(\d{4})/);
      if (match) return match[1];
    }
  }

  // 3. Official date fields
  let year = getYearFromDate(movie.publish_date) || getYearFromDate(movie.release_date);
  if (year) return year;

  // 4. Regex from names/slugs
  // Title format often: "Movie Name (2024)"
  const title = movie.name || movie.title || '';
  const originName = movie.origin_name || '';
  const slug = movie.slug || '';

  const titleMatch = title.match(/\((\d{4})\)/);
  if (titleMatch) return titleMatch[1];

  const slugMatch = slug.match(/-(\d{4})$/) || slug.match(/-(\d{4})-/); // End of slug or middle
  if (slugMatch) return slugMatch[1];

  const originMatch = originName.match(/\b(\d{4})\b/);
  if (originMatch) return originMatch[1];

  // Loose title match (last resort for title)
  const looseTitleMatch = title.match(/\b(19\d{2}|20\d{2})\b/);
  if (looseTitleMatch) return looseTitleMatch[1];

  // 5. Creation times (removed as they often reflect DB insertion time, not release time)
  // year = getYearFromDate(movie.created_time) ...

  // 6. Modification times (removed)
  // year = getYearFromDate(movie.updated_time); ...

  return year || '';
};
