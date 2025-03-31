import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelNotFoundComponent } from './model-not-found.component';

describe('ModelNotFoundComponent', () => {
  let component: ModelNotFoundComponent;
  let fixture: ComponentFixture<ModelNotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelNotFoundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
