import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionListModalComponent } from './selection-list-modal.component';

describe('SelectionListModalComponent', () => {
  let component: SelectionListModalComponent;
  let fixture: ComponentFixture<SelectionListModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectionListModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectionListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
