import { Injectable } from "@angular/core";
import { AccountCategory } from "../models/account-category.model";
import { Account } from "../models/account.model";
import { Entry } from "../models/entry.model";

export interface ImportExportData {
  entries: Entry[];
  accounts: Account[];
  accountCategories: AccountCategory[];
}

@Injectable({
  providedIn: "root"
})
export class ImportExportService {
  constructor() {}

  exportData() {}
}
