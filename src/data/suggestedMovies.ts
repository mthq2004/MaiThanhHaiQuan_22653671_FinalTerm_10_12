export interface SuggestedMovie {
  title: string;
  year: number;
  rating?: number;
}

export const suggestedMovies: SuggestedMovie[] = [
  { title: "The Shawshank Redemption", year: 1994, rating: 9 },
  { title: "The Godfather", year: 1972, rating: 9 },
  { title: "The Dark Knight", year: 2008, rating: 9 },
  { title: "Pulp Fiction", year: 1994, rating: 9 },
  { title: "Forrest Gump", year: 1994, rating: 9 },
  { title: "Inception", year: 2010, rating: 9 },
  { title: "Fight Club", year: 1999, rating: 9 },
  { title: "The Matrix", year: 1999, rating: 8 },
  { title: "Goodfellas", year: 1990, rating: 9 },
  { title: "The Silence of the Lambs", year: 1991, rating: 8 },
  { title: "Saving Private Ryan", year: 1998, rating: 8 },
  { title: "Jurassic Park", year: 1993, rating: 8 },
  { title: "Avatar", year: 2009, rating: 8 },
  { title: "Titanic", year: 1997, rating: 8 },
  { title: "The Avengers", year: 2012, rating: 8 },
  { title: "Interstellar", year: 2014, rating: 9 },
  { title: "The Wolf of Wall Street", year: 2013, rating: 8 },
  { title: "Django Unchained", year: 2012, rating: 8 },
  { title: "The Prestige", year: 2006, rating: 8 },
  { title: "Gladiator", year: 2000, rating: 8 },
];
