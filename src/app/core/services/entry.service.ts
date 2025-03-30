import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Entry, GroupedEntry } from "../models/entry.model";
import { DatabaseService } from "./database.service";

@Injectable({
  providedIn: "root"
})
export class EntryService {
  private entriesSubject = new BehaviorSubject<Entry[]>([]);
  public entries$ = this.entriesSubject.asObservable();

  constructor(private databaseService: DatabaseService) {
    this.loadEntries();
  }

  private async loadEntries() {
    const entries = await this.databaseService.entries.toArray();
    this.entriesSubject.next(entries);
  }

  /**
   * Validates an entry
   * @param entry Entry to validate
   * @param isUpdate Whether this is for an update operation
   * @throws Error if any validation fails
   */
  private async validateEntry(entry: Entry, isUpdate = false): Promise<void> {
    // Basic validations
    if (isUpdate && !entry.id) {
      throw new Error("Cannot update an entry without an ID");
    }

    if (!entry.date) {
      throw new Error("Date is required");
    }

    if (!entry.accountId) {
      throw new Error("Account ID is required");
    }

    if (entry.balance === undefined) {
      throw new Error("Balance is required");
    }

    if (entry.balance < 0) {
      throw new Error("Balance cannot be negative");
    }

    if (!isUpdate) {
      // Check if entry already exists for the same date and account ID
      const exists = await this.databaseService.entries
        .where("date")
        .equals(entry.date)
        .and((e) => e.accountId === entry.accountId)
        .count();

      if (exists > 0) {
        throw new Error("An entry for this date and account ID already exists");
      }
    }
  }

  async add(entry: Entry): Promise<number> {
    await this.validateEntry(entry);

    const id = await this.databaseService.entries.add(entry);
    await this.loadEntries();

    return id;
  }

  async get(id: number): Promise<Entry | undefined> {
    return await this.databaseService.entries.get(id);
  }

  async getByAccountIdAndDate(
    id: number,
    date: string
  ): Promise<Entry | undefined> {
    return await this.databaseService.entries
      .where("date")
      .equals(date)
      .and((e) => e.accountId === id)
      .first();
  }

  async getMostRecentGroupedEntry(): Promise<GroupedEntry | undefined> {
    const groupedEntries = await this.getAllGrouped();
    let mostRecentEntry: GroupedEntry | undefined;
    for (const group of groupedEntries) {
      if (
        !mostRecentEntry ||
        new Date(group.date) > new Date(mostRecentEntry.date)
      ) {
        mostRecentEntry = group;
      }
    }

    return mostRecentEntry;
  }

  async getMostRecentEntryByAccountId(id: number): Promise<Entry | undefined> {
    const entries = await this.databaseService.entries
      .where("accountId")
      .equals(id)
      .sortBy("date");

    return entries.length > 0 ? entries[entries.length - 1] : undefined;
  }

  async getAccountBalance(
    accountId: number,
    date: string
  ): Promise<number | undefined> {
    const entry = await this.databaseService.entries
      .where("date")
      .equals(date)
      .and((e) => e.accountId === accountId)
      .first();

    return entry ? entry.balance : undefined;
  }

  async getAll(): Promise<Entry[]> {
    return await this.databaseService.entries.toArray();
  }

  async getAllWhere(predicate: (entry: Entry) => boolean): Promise<Entry[]> {
    return await this.databaseService.entries.filter(predicate).toArray();
  }

  async getAllGrouped(): Promise<GroupedEntry[]> {
    const entries = await this.databaseService.entries.toArray();
    const groups = new Map<string, Entry[]>();

    for (const entry of entries) {
      if (groups.has(entry.date)) {
        groups.get(entry.date)!.push(entry);
      } else {
        groups.set(entry.date, [entry]);
      }
    }

    return Array.from(groups.entries()).map(([date, entries]) => ({
      date,
      entries
    }));
  }

  async update(entryId: number, entry: Partial<Entry>): Promise<number> {
    const existingEntry = await this.databaseService.entries.get(entryId);

    if (!existingEntry) {
      throw new Error(`Entry with ID ${entryId} not found.`);
    }

    const updatedEntry: Entry = {
      ...existingEntry,
      ...entry
    };

    await this.validateEntry(updatedEntry, true);

    const updatedId = await this.databaseService.entries.update(
      updatedEntry.id!,
      updatedEntry
    );

    await this.loadEntries();

    return updatedId;
  }

  async remove(id: number) {
    // Check if entry exists
    const existingEntry = await this.databaseService.entries.get(id);

    if (!existingEntry) {
      throw new Error("Entry not found");
    }

    await this.databaseService.entries.delete(id);
    await this.loadEntries();
  }

  async removeAllOnDate(date: string) {
    // Check if entry exists
    const existingEntries = await this.databaseService.entries
      .where("date")
      .equals(date)
      .toArray();

    if (existingEntries.length === 0) {
      throw new Error("No entries found for the specified date");
    }

    await this.databaseService.entries.where("date").equals(date).delete();
    await this.loadEntries();
  }
}
