export interface Entry {
  id?: number;
  // MM/DD/YYYY
  date: string;
  accountId: number; // FK to Account
  balance: number;
}

export interface GroupedEntry {
  // MM/DD/YYYY
  date: string;
  entries: Entry[];
}
