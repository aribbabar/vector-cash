import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountCategoriesComponent } from './account-categories.component';

describe('AccountCategoriesComponent', () => {
  let component: AccountCategoriesComponent;
  let fixture: ComponentFixture<AccountCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountCategoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
