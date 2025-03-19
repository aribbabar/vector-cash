import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Entry } from '../../core/models/entry.model';
import { AccountService } from '../../core/services/account.service';
import { EntryService } from '../../core/services/entry.service';

@Component({
  selector: 'app-entries-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatSelectModule,
    MatSortModule,
    MatPaginatorModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './entries-table.component.html',
  styleUrl: './entries-table.component.css'
})
export class EntriesTableComponent {
  displayedColumns: string[] = ['date', 'account', 'balance'];
  dataSource = new MatTableDataSource<Entry>();
  totalEntries = 0;
  pageSize = 5;
  pageIndex = 0;
  accountMap: { [key: number]: string } = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private entryService: EntryService,
    private accountService: AccountService
  ) {}

  async ngOnInit() {
    this.totalEntries = await this.entryService.getTotalEntries();
    const accounts = await this.accountService.getAccounts();
    this.accountMap = accounts.reduce((acc, account) => {
      acc[account.id!] = account.name;
      return acc;
    }, {} as { [key: number]: string });
    await this.loadEntries();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadEntries(event?: PageEvent) {
    if (event) {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
    }

    const offset = this.pageIndex * this.pageSize;
    const limit = this.pageSize;
    const paginatedEntries = await this.entryService.getPaginatedEntries(
      offset,
      limit
    );

    this.dataSource = new MatTableDataSource(paginatedEntries);
    this.paginator.length = this.totalEntries;
    this.paginator.pageIndex = this.pageIndex;
  }

  getAccountName(accountId: number): string {
    return this.accountMap[accountId];
  }
}
