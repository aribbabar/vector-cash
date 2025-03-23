export class AccountCategory {
  id?: number;
  name!: string; // e.g, "Checking", "Savings", "Credit Card", "Investment"
  isActive: boolean = true;

  toString(): string {
    return this.name;
  }
}
