import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs/Observable';

import { TablesEffects } from './tables.effects';

describe('TableService', () => {
  let actions$: Observable<any>;
  let effects: TablesEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TablesEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(TablesEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
