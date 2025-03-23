import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccountCategory } from '../../core/models/account-category.model';
import { Account } from '../../core/models/account.model';
import { AccountCategoryService } from '../../core/services/account-category.service';
import { AccountService } from '../../core/services/account.service';
import {
  FormattedDataService,
  FormattedEntry
} from '../../core/services/formatted-data.service';
import { GlobalEventService } from '../../core/services/global-event.service';
import { GlobalEvents } from '../../core/utils/global-events';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { EntryDialogComponent } from '../entry-dialog/entry-dialog.component';

@Component({
  selector: 'app-entries',
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
    CommonModule
  ],
  templateUrl: './entries.component.html',
  styleUrl: './entries.component.css'
})
export class EntriesComponent implements OnInit {
  displayedColumns: string[] = ['date'];
  dataSource = new MatTableDataSource<any>([]);
  totalEntries = 0;
  pageSize = 5;
  pageIndex = 0;
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];
  formattedEntries: FormattedEntry[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private globalEventService: GlobalEventService,
    private accountService: AccountService,
    public accountCategoryService: AccountCategoryService,
    private formattedData: FormattedDataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    this.accounts = await this.accountService.getAccounts();
    this.accountCategories =
      await this.accountCategoryService.getAccountCategories();
    this.formattedEntries = await this.formattedData.getFormattedEntries();

    this.displayedColumns = [
      'date',
      ...this.accounts.map((account) => account.toString()),
      'actions' // Add actions column
    ];

    this.dataSource = new MatTableDataSource<FormattedEntry>(
      this.formattedEntries
    );

    // Custom sorting for non-standard columns (especially for account balances)
    this.dataSource.sortingDataAccessor = (
      entry: FormattedEntry,
      columnId: string
    ) => {
      if (columnId === 'date') {
        return new Date(entry.date).getTime(); // Convert to timestamp for date sorting
      }

      // For account columns (which are account.toString())
      const account = this.accounts.find((acc) => acc.toString() === columnId);
      if (account) {
        return this.getAccountBalance(entry, account.id!);
      }

      return 0;
    };

    this.totalEntries = this.formattedEntries.length;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.sort.sort({
      id: 'date',
      start: 'desc',
      disableClear: false
    });

    this.globalEventService.events$.subscribe((event) => {
      if (event.name === GlobalEvents.REFRESH_ENTRIES) {
        this.refreshEntries();
      }
    });
  }

  getAccountCategory(categoryId: number): string {
    return (
      this.accountCategories
        .find((category) => category.id === categoryId)
        ?.toString() || ''
    );
  }

  getAccountBalance(entry: FormattedEntry, accountId: number): number {
    const accountEntry = entry.accounts.find(
      (account) => account.id === accountId
    );
    return accountEntry ? accountEntry.balance : 0;
  }

  loadEntries(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  openUpdateDialog(entry: FormattedEntry): void {
    const dialogRef = this.dialog.open(EntryDialogComponent, {
      data: { entry: entry }
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      if (result) {
        this.snackBar.open('Entry updated', 'Dismiss', { duration: 5000 });
      }
    });
  }

  openDeleteDialog(entry: FormattedEntry): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteEntry(entry);
      }
    });
  }

  private async deleteEntry(entry: FormattedEntry): Promise<void> {
    try {
      await this.formattedData.deleteFormattedEntries(entry.date);
      this.snackBar.open('Entry deleted', 'Dismiss', { duration: 5000 });
      this.refreshEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      this.snackBar.open('Error deleting entry', 'Dismiss', { duration: 5000 });
    }
  }

  private async refreshEntries(): Promise<void> {
    this.formattedEntries = await this.formattedData.getFormattedEntries();
    this.dataSource.data = this.formattedEntries;
    this.totalEntries = this.formattedEntries.length;
  }
}
