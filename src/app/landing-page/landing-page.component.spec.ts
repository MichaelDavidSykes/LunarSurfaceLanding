import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { GlobalSnackbarService } from '../shared/global-snackbar/global-snackbar.service';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LandingPageComponent],
      imports: [
        RouterTestingModule
      ],
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: GlobalSnackbarService,
          useValue: jasmine.createSpyObj<GlobalSnackbarService>('GlobalSnackbarService', ['open'])
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not replace global console handlers during component init', () => {
    const warn = console.warn;
    const error = console.error;

    component.ngOnInit();

    expect(console.warn).toBe(warn);
    expect(console.error).toBe(error);
  });
});
