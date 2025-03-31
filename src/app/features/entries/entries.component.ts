import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AccountCategory } from "../../core/models/account-category.model";
import { Account } from "../../core/models/account.model";
import { GroupedEntry } from "../../core/models/entry.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import { AccountService } from "../../core/services/account.service";
import { EntryService } from "../../core/services/entry.service";
import { DeleteDialogComponent } from "../delete-dialog/delete-dialog.component";
import { EntryDialogComponent } from "../entry-dialog/entry-dialog.component";
import { ModelNotFoundComponent } from "../model-not-found/model-not-found.component";

@Component({
  selector: "app-entries",
  standalone: true,
  imports: [
    MatTableModule,
    MatSelectModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    DatePipe,
    CurrencyPipe,
    CommonModule,
    ModelNotFoundComponent
  ],
  templateUrl: "./entries.component.html",
  styleUrl: "./entries.component.css"
})
export class EntriesComponent implements OnInit {
  entryDialogComponent = EntryDialogComponent;
  displayedColumns: string[] = ["date"];
  dataSource: MatTableDataSource<GroupedEntry> =
    new MatTableDataSource<GroupedEntry>([]);
  groupedEntries: GroupedEntry[] = [];
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];
  totalEntries = 0;
  pageSize = 5;
  pageIndex = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    // Load initial data before subscribing to changes
    this.accounts = await this.accountService.getAll();
    this.accountCategories = await this.accountCategoryService.getAll();
    this.groupedEntries = await this.entryService.getAllGrouped();

    this.updateDisplayedColumns();

    // Now subscribe to future changes
    this.entryService.entries$.subscribe(async () => {
      this.groupedEntries = await this.entryService.getAllGrouped();
      this.updateTableData();
    });

    this.accountService.accounts$.subscribe((accounts) => {
      this.accounts = accounts;
      this.updateDisplayedColumns();
      this.updateTableData();
    });

    this.accountCategoryService.accountCategories$.subscribe((categories) => {
      this.accountCategories = categories;
      this.updateDisplayedColumns();
      this.updateTableData();
    });
  }

  ngAfterViewInit() {
    this.configureSort();
    this.updateDisplayedColumns();
    this.updateTableData();
  }

  private configureSort(): void {
    // Set up custom sorting logic
    this.dataSource.sortingDataAccessor = (
      item: GroupedEntry,
      property: string
    ) => {
      if (property === "date") {
        return new Date(item.date).getTime();
      }

      // For account columns, return the amount or 0 if not found
      const accountId = Number(property);
      if (!isNaN(accountId)) {
        const entry = item.entries.find((e) => e.accountId === accountId);
        return entry ? entry.balance : 0;
      }

      // Fallback to generic accessor
      return this.getPropertyValue(item, property);
    };
  }

  // Helper method to safely access nested properties
  private getPropertyValue(item: any, property: string): string | number {
    const value = item[property as keyof typeof item];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
    return "";
  }

  private updateDisplayedColumns(): void {
    // Start with date column
    this.displayedColumns = ["date"];

    // Add account columns
    if (this.accounts && this.accounts.length > 0) {
      // Add each account as a column
      this.accounts.forEach((account) => {
        this.displayedColumns.push(account.id!.toString());
      });
    }

    // Add actions column last
    this.displayedColumns.push("actions");
  }

  private updateTableData(): void {
    // Update the data source
    this.dataSource.data = this.groupedEntries;
    this.totalEntries = this.groupedEntries.length;

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Apply default sort by date in descending order (newest first)
    if (this.sort && !this.sort.active) {
      this.sort.sort({
        id: "date",
        start: "desc",
        disableClear: false
      });
    }
  }

  getAccountEntryAmount(
    groupedEntry: GroupedEntry,
    accountId: number
  ): number | null {
    const entry = groupedEntry.entries.find((e) => e.accountId === accountId);
    return entry ? entry.balance : null;
  }

  getAccountCategoryClass(accountId: number): string {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return "";

    const accountCategory = this.accountCategories.find(
      (c) => c.id === account.categoryId
    );

    if (accountCategory?.type === "Asset") {
      return "asset-color";
    } else if (accountCategory?.type === "Liability") {
      return "liability-color";
    }

    return "";
  }

  openUpdateDialog(entry: GroupedEntry): void {
    const dialogRef = this.dialog.open(EntryDialogComponent, {
      data: { entry: entry }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open("Entry updated", "Dismiss", { duration: 5000 });
      }
    });
  }

  openDeleteDialog(entry: GroupedEntry): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: "Delete Entry",
        message: `Are you sure you want to delete the entry for ${entry.date}?`,
        confirmText: "Delete",
        cancelText: "Cancel"
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeEntries(entry);
      }
    });
  }

  async removeEntries(entry: GroupedEntry): Promise<void> {
    try {
      await this.entryService.removeAllOnDate(entry.date);
      this.snackBar.open("Entry deleted", "Dismiss", { duration: 5000 });
    } catch (error) {
      console.error("Error deleting entry:", error);
      this.snackBar.open("Error deleting entry", "Dismiss", { duration: 5000 });
    }
  }
}
