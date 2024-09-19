import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorconfigComponent } from './errorconfig.component';

describe('ErrorconfigComponent', () => {
  let component: ErrorconfigComponent;
  let fixture: ComponentFixture<ErrorconfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorconfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorconfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
