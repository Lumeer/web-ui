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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {filter, take} from 'rxjs/operators';
import {UsersAction} from '../../../core/store/users/users.action';
import {Observable} from 'rxjs';
import {User} from '../../../core/store/users/user';
import {LanguageCode} from '../../top-panel/user-panel/user-menu/language';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Component({
  selector: 'referrals-overview',
  templateUrl: './referrals-overview-modal.component.html',
  styleUrls: ['./referrals-overview-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferralsOverviewModalComponent implements OnInit {
  public readonly dialogType = DialogType;

  public readonly locale: string;
  public readonly languageCode = LanguageCode;

  public user: Observable<User>;

  public constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    this.locale = configurationService.getConfiguration().locale;
  }

  public ngOnInit(): void {
    this.store$
      .pipe(
        select(selectCurrentUser),
        take(1),
        filter(user => !user.referrals)
      )
      .subscribe(user => this.store$.dispatch(new UsersAction.Referrals()));
    this.user = this.store$.pipe(select(selectCurrentUser));
  }

  public cancelDialog() {
    this.bsModalRef.hide();
  }
}
