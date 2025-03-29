import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { AccountCategory } from "../../core/models/account-category.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import {
  FormattedAccount,
  FormattedDataService
} from "../../core/services/formatted-data.service";
import { AccountCategoriesComponent } from "../account-categories/account-categories.component";
import { AccountCategoryDialogComponent } from "../account-category-dialog/account-category-dialog.component";
import { AccountDialogComponent } from "../account-dialog/account-dialog.component";
import { AccountsComponent } from "../accounts/accounts.component";
import { ChartComponent } from "../chart/chart.component";
import { EntriesComponent } from "../entries/entries.component";
import { EntryDialogComponent } from "../entry-dialog/entry-dialog.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    CommonModule,
    EntriesComponent,
    AccountsComponent,
    AccountCategoriesComponent,
    AccountCategoriesComponent,
    ChartComponent
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css"
})
export class DashboardComponent implements OnInit {
  activeAccounts: FormattedAccount[] = [];
  categories: AccountCategory[] = [];
  assetsTotal = 0;
  liabilitiesTotal = 0;
  netWorth = 0;

  constructor(
    private dialog: MatDialog,
    private accountCategoryService: AccountCategoryService,
    private formattedDataService: FormattedDataService
  ) {}

  async ngOnInit(): Promise<void> {
    this.activeAccounts =
      await this.formattedDataService.getFormattedAccounts(true);
    this.categories = await this.accountCategoryService.getAll();

    // Calculate financial totals when data is loaded
    this.calculateFinancialTotals();
  }

  calculateFinancialTotals(): void {
    // Calculate assets total
    this.assetsTotal = this.activeAccounts
      .filter((account) => {
        const category = this.categories.find(
          (cat) => cat.id === account.category!.id
        );
        return category?.type === "Asset";
      })
      .reduce((total, account) => total + account.balance, 0);

    // Calculate liabilities total
    this.liabilitiesTotal = this.activeAccounts
      .filter((account) => {
        const category = this.categories.find(
          (cat) => cat.id === account.category!.id
        );
        return category?.type === "Liability";
      })
      .reduce((total, account) => total + account.balance, 0);

    // Calculate net worth
    this.netWorth = this.assetsTotal - this.liabilitiesTotal;
  }

  openEntryDialog(): void {
    this.blurActiveElement();
    this.dialog.open(EntryDialogComponent, {
      width: "500px"
    });
  }

  openAccountDialog(): void {
    this.blurActiveElement();
    this.dialog.open(AccountDialogComponent, {
      width: "500px"
    });
  }

  openCategoryDialog(): void {
    this.blurActiveElement();
    this.dialog.open(AccountCategoryDialogComponent, {
      width: "500px"
    });
  }

  // Prevents the Blocked aria-hidden attribute error
  blurActiveElement(): void {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur();
  }
}
