import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountCategoryDialogComponent } from './account-category-dialog.component';

describe('AccountCategoryDialogComponent', () => {
  let component: AccountCategoryDialogComponent;
  let fixture: ComponentFixture<AccountCategoryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountCategoryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountCategoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
