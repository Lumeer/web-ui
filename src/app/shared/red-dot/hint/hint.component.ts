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
import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Observable} from 'rxjs';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {map} from 'rxjs/operators';

@Component({
  selector: 'hint',
  templateUrl: './hint.component.html',
  styleUrls: ['./hint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HintComponent implements OnInit {
  @Input()
  public title: string;

  @Input()
  public footer: string;

  public hintsEnabled$: Observable<boolean>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.hintsEnabled$ = this.store$.pipe(
      select(selectCurrentUser),
      map(user => user.hints.applicationHints)
    );
  }
}
