export class Account {
  id?: number;
  name!: string; // e.g, "Chase Checking", "Discover it", "Fidelity Brokerage"
  categoryId!: number; // FK to AccountCategory
  isActive: boolean = true;

  toString(): string {
    return this.name;
  }
}
