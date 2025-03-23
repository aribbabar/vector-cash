export class AccountCategory {
  id?: number;
  name!: string; // e.g, "Checking", "Savings", "Credit Card", "Investment"

  toString(): string {
    return this.name;
  }
}
