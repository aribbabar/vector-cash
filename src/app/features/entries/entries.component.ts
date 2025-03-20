import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormattedDataService } from '../../core/services/formatted-data.service';

interface TableEntry {
  date: Date;
  [accountName: string]: any;
}

@Component({
  selector: 'app-entries',
  standalone: true,
  imports: [
    MatTableModule,
    MatSelectModule,
    MatSortModule,
    MatPaginatorModule,
    DatePipe,
    CurrencyPipe,
    CommonModule
  ],
  templateUrl: './entries.component.html',
  styleUrl: './entries.component.css'
})
export class EntriesComponent implements OnInit {
  displayedColumns: string[] = ['date'];
  dataSource = new MatTableDataSource<TableEntry>([]);
  totalEntries = 0;
  pageSize = 5;
  pageIndex = 0;
  accounts: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private formattedDataService: FormattedDataService) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  async loadEntries(event?: PageEvent): Promise<void> {
    const formattedEntries = await this.formattedDataService.getEntriesByDate();
    this.totalEntries = formattedEntries.length;

    // Extract all unique account names
    const uniqueAccounts = new Set<string>();
    formattedEntries.forEach((entry) => {
      entry.accounts.forEach((account) => {
        uniqueAccounts.add(account.account);
      });
    });

    this.accounts = Array.from(uniqueAccounts);
    this.displayedColumns = ['date', ...this.accounts];

    // Transform data to have accounts as columns
    const tableData: TableEntry[] = formattedEntries.map((entry) => {
      const tableEntry: TableEntry = { date: entry.date };

      // Initialize all account values to null/undefined
      this.accounts.forEach((account) => {
        tableEntry[account] = 0;
      });

      // Fill in the values for accounts that have data
      entry.accounts.forEach((accountData) => {
        tableEntry[accountData.account] = accountData.balance;
      });

      return tableEntry;
    });

    // Sort the table data by date in descending order (latest first)
    const sortedData = tableData.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    this.dataSource.data = sortedData;

    this.dataSource.data = tableData;

    // Apply sorting and pagination after data is loaded
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    if (event) {
      this.pageSize = event.pageSize;
      this.pageIndex = event.pageIndex;
    }
  }
}
