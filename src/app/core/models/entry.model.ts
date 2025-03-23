export class Entry {
  id?: number;
  // MM/DD/YYYY
  date!: string;
  accountId!: number; // FK to Account
  balance!: number;
}
