export interface Account {
  id?: number;
  name: string; // e.g, "Chase Checking", "Discover it", "Fidelity Brokerage"
  categoryId: number; // FK to AccountCategory
  isActive?: boolean;
}
