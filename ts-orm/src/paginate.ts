export type Page<T> = {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
  items: T[];
};

export type Cursor<T> = {
  next: number | null;
  items: T[];
};
