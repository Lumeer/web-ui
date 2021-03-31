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

import {Component, OnInit, ChangeDetectionStrategy, HostListener} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {NotificationSettings, User} from '../../../core/store/users/user';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {KeyCode} from '../../key-code';
import {UsersAction} from '../../../core/store/users/users.action';
import {LanguageCode} from '../../top-panel/user-panel/user-menu/language';
import {tap} from 'rxjs/operators';
import {deepObjectCopy, deepObjectsEquals} from '../../utils/common.utils';

@Component({
  templateUrl: './user-settings-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsModalComponent implements OnInit {
  public user$: Observable<User>;
  public performingAction$ = new BehaviorSubject(false);

  private updateUser: Partial<User>;
  private user: User;

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.user$ = this.store$.pipe(
      select(selectCurrentUser),
      tap(user => {
        this.user = user;
        this.checkPatchUser(user);
      })
    );
  }

  private checkPatchUser(user: User) {
    if (!this.updateUser) {
      this.updateUser = this.createPatchUser(user);
    }
  }

  private createPatchUser(user: User): Partial<User> {
    return {
      name: user.name,
      notifications: deepObjectCopy(user.notifications),
    };
  }

  public onSubmit() {
    if (this.checkPatchChanged()) {
      this.updateNotifications();
    } else {
      this.hideDialog();
    }
  }

  private checkPatchChanged(): boolean {
    return !deepObjectsEquals(this.createPatchUser(this.user), this.updateUser);
  }

  private updateNotifications() {
    this.performingAction$.next(true);
    this.store$.dispatch(
      new UsersAction.PatchCurrentUser({
        user: this.updateUser,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }

  public onSettingsChange(settings: NotificationSettings[]) {
    if (this.updateUser.notifications) {
      this.updateUser.notifications.settings = settings;
    } else {
      this.updateUser.notifications = {settings};
    }
  }

  public onLanguageChange(language: LanguageCode) {
    if (this.updateUser.notifications) {
      this.updateUser.notifications.language = language;
    } else {
      this.updateUser.notifications = {language};
    }
  }

  public onNameChange(name: string) {
    this.updateUser.name = name;
  }
}
