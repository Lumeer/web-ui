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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Observable} from 'rxjs';
import {UserHints, UserHintsKeys} from '../../../core/store/users/user';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {map} from 'rxjs/operators';
import {UsersAction} from '../../../core/store/users/users.action';

@Component({
  selector: 'lumeer-logo',
  templateUrl: './lumeer-logo.component.html',
  styleUrls: ['./lumeer-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LumeerLogoComponent implements OnInit {
  @Input()
  public height: number;

  @Input()
  public link: any[];

  @Input()
  public text: string;

  @Input()
  public showTooltip: boolean;

  public readonly tooltip: string;

  public hintVisible$: Observable<boolean>;

  constructor(public element: ElementRef<HTMLElement>, private store$: Store<AppState>) {
    this.tooltip = $localize`:@@topPanel.home.title:Back to home screen`;
  }

  public ngOnInit(): void {
    this.hintVisible$ = this.store$.pipe(
      select(selectCurrentUser),
      map(user => !user.hints?.logoHintDismissed)
    );
  }

  public onHintDismissed() {
    this.store$.dispatch(new UsersAction.SetHint({hint: UserHintsKeys.logoHintDismissed, value: true}));
  }
}
