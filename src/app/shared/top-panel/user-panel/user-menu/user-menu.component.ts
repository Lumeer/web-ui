/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {UserModel} from 'src/app/core/store/users/user.model';
import {environment} from '../../../../../environments/environment';
import {AuthService} from '../../../../auth/auth.service';
import {AppState} from '../../../../core/store/app.state';
import {selectUrl} from '../../../../core/store/navigation/navigation.state';
import {DialogService} from '../../../../dialog/dialog.service';
import {selectCurrentUser} from './../../../../core/store/users/users.state';

@Component({
  selector: 'user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  public readonly buildNumber = environment.buildNumber;
  public readonly locale = environment.locale;

  public currentUser$: Observable<UserModel>;
  public url$: Observable<string>;

  public constructor(
    private authService: AuthService,
    private dialogService: DialogService,
    private store: Store<AppState>
  ) {}

  public ngOnInit() {
    this.currentUser$ = this.store.pipe(select(selectCurrentUser));
    this.url$ = this.store.pipe(select(selectUrl));
  }

  public onFeedbackClick() {
    this.dialogService.openFeedbackDialog();
  }

  public onLogoutClick() {
    this.authService.logout();
  }
}
