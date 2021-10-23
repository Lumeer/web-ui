/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {UsersAction} from '../../core/store/users/users.action';
import {animate, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'hint-box',
  templateUrl: './hint-box.component.html',
  animations: [
    trigger('inOutAnimation', [
      transition(':leave', [
        style({transform: 'translateX(0%)', opacity: 1}),
        animate('.5s ease-in', style({transform: 'translateX(-75%)', opacity: 0})),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HintBoxComponent implements OnInit {
  @Input()
  public condition: boolean = true;

  @Input()
  private hintKey;

  @Input()
  public additionalClasses: string;

  public visible$: Observable<boolean>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.visible$ = this.store$.pipe(
      select(selectCurrentUser),
      map(user => !user.hints?.[this.hintKey])
    );
  }

  public dismiss() {
    // true = dismissed
    this.store$.dispatch(new UsersAction.SetHint({hint: this.hintKey, value: true}));
  }
}
