import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { AccountCategory } from "../../core/models/account-category.model";
import { Account } from "../../core/models/account.model";
import { GroupedEntry } from "../../core/models/entry.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import { AccountService } from "../../core/services/account.service";
import { EntryService } from "../../core/services/entry.service";
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
  mostRecentGroupedEntry: GroupedEntry | undefined;
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];
  assetsTotal = 0;
  liabilitiesTotal = 0;
  netWorth = 0;

  constructor(
    private dialog: MatDialog,
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService
  ) {}

  async ngOnInit(): Promise<void> {
    this.entryService.entries$.subscribe(async (entries) => {
      this.mostRecentGroupedEntry =
        await this.entryService.getMostRecentGroupedEntry();

      // Calculate financial totals when data is loaded
      this.calculateFinancialTotals();
    });

    this.accountService.accounts$.subscribe((accounts) => {
      this.accounts = accounts;
    });

    this.accountCategoryService.accountCategories$.subscribe((categories) => {
      this.accountCategories = categories;
    });
  }

  calculateFinancialTotals() {
    // Reset totals
    this.assetsTotal = 0;
    this.liabilitiesTotal = 0;

    this.accounts.reduce((acc, account) => {
      const category = this.accountCategories.find(
        (cat) => cat.id === account.categoryId
      );

      if (category) {
        // If category is an asset type, add to assets
        if (category.type === "Asset") {
          this.assetsTotal +=
            this.mostRecentGroupedEntry?.entries.find(
              (entry) => entry.accountId === account.id
            )?.balance || 0;
        }
        // If category is a liability type, add to liabilities
        else if (category.type === "Liability") {
          this.liabilitiesTotal +=
            this.mostRecentGroupedEntry?.entries.find(
              (entry) => entry.accountId === account.id
            )?.balance || 0;
        }
      }

      return acc;
    }, {});

    // Calculate net worth (assets minus liabilities)
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
