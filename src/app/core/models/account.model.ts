export class Account {
  id?: number;
  name!: string; // e.g, "Chase Checking", "Discover it", "Fidelity Brokerage"
  type!: 'Asset' | 'Liability';
  categoryId!: number; // FK to AccountCategory

  toString(): string {
    return this.name;
  }
}
