import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AccountCategory } from '../../core/models/account-category.model';
import { AccountCategoryService } from '../../core/services/account-category.service';
import { AccountService } from '../../core/services/account.service';
import { AccountCategoryDialogComponent } from '../account-category-dialog/account-category-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { AccountCategoriesComponent } from './account-categories.component';

describe('AccountCategoriesComponent', () => {
  let component: AccountCategoriesComponent;
  let fixture: ComponentFixture<AccountCategoriesComponent>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;
  let accountCategoryServiceSpy: jasmine.SpyObj<AccountCategoryService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockCategories: AccountCategory[] = [
    {
      id: 1,
      name: 'Checking',
      isActive: true,
      type: 'Asset',
      description: ''
    },
    {
      id: 2,
      name: 'Credit Card',
      type: 'Liability',
      isActive: true,
      description: 'My credit cards'
    }
  ];

  beforeEach(async () => {
    const accountServiceMock = jasmine.createSpyObj('AccountService', [
      'hasActiveAccountsInCategory'
    ]);
    const accountCategoryServiceMock = jasmine.createSpyObj(
      'AccountCategoryService',
      [
        'getActiveAccountCategories',
        'updateAccountCategory',
        'setAccountCategoryActiveStatus'
      ]
    );
    const dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [AccountCategoriesComponent, NoopAnimationsModule],
      providers: [
        { provide: AccountService, useValue: accountServiceMock },
        {
          provide: AccountCategoryService,
          useValue: accountCategoryServiceMock
        },
        { provide: MatDialog, useValue: dialogMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    }).compileComponents();

    accountServiceSpy = TestBed.inject(
      AccountService
    ) as jasmine.SpyObj<AccountService>;
    accountCategoryServiceSpy = TestBed.inject(
      AccountCategoryService
    ) as jasmine.SpyObj<AccountCategoryService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    accountCategoryServiceSpy.getActiveAccountCategories.and.resolveTo(
      mockCategories
    );

    fixture = TestBed.createComponent(AccountCategoriesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', async () => {
    await component.ngOnInit();
    expect(
      accountCategoryServiceSpy.getActiveAccountCategories
    ).toHaveBeenCalled();
    expect(component.accountCategories).toEqual(mockCategories);
  });

  it('should open add category dialog', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    component.openAddCategoryDialog();

    expect(dialogSpy.open).toHaveBeenCalledWith(
      AccountCategoryDialogComponent,
      {
        width: '400px',
        data: { category: jasmine.any(Object) }
      }
    );
  });

  it('should edit category and update when dialog confirmed', async () => {
    const updatedCategory: AccountCategory = {
      id: 1,
      name: 'Updated Assets',
      isActive: true,
      type: 'Asset',
      description: ''
    };
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(updatedCategory)
    } as any);

    component.editCategory(mockCategories[0]);

    expect(dialogSpy.open).toHaveBeenCalledWith(
      AccountCategoryDialogComponent,
      {
        width: '400px',
        data: mockCategories[0]
      }
    );

    // Wait for afterClosed subscription to complete
    await fixture.whenStable();

    expect(
      accountCategoryServiceSpy.updateAccountCategory
    ).toHaveBeenCalledWith(updatedCategory);
    expect(
      accountCategoryServiceSpy.getActiveAccountCategories
    ).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      `Category "Updated Assets" has been updated.`,
      'Dismiss',
      { duration: 5000 }
    );
  });

  it('should prevent deleting category with associated accounts', async () => {
    accountServiceSpy.hasActiveAccountsInCategory.and.resolveTo(true);

    await component.deleteCategory(mockCategories[0]);

    expect(accountServiceSpy.hasActiveAccountsInCategory).toHaveBeenCalledWith(
      1
    );
    expect(dialogSpy.open).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      `Cannot delete category "Assets" because it has associated accounts.`,
      'Dismiss',
      { duration: 5000 }
    );
  });

  it('should delete category when confirmed and no associated accounts', async () => {
    accountServiceSpy.hasActiveAccountsInCategory.and.resolveTo(false);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

    await component.deleteCategory(mockCategories[0]);

    expect(accountServiceSpy.hasActiveAccountsInCategory).toHaveBeenCalledWith(
      1
    );
    expect(dialogSpy.open).toHaveBeenCalledWith(DeleteDialogComponent, {
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete the category "Assets"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    // Wait for afterClosed subscription to complete
    await fixture.whenStable();

    expect(
      accountCategoryServiceSpy.setAccountCategoryActiveStatus
    ).toHaveBeenCalledWith(1, false);
    expect(
      accountCategoryServiceSpy.getActiveAccountCategories
    ).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      `Category "Assets" has been deleted.`,
      'Dismiss',
      { duration: 5000 }
    );
  });

  it('should handle error when deleting category', async () => {
    accountServiceSpy.hasActiveAccountsInCategory.and.rejectWith(
      new Error('Test error')
    );

    await component.deleteCategory(mockCategories[0]);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'An error occurred while trying to delete the category.',
      'Close',
      { duration: 5000 }
    );
  });
});
