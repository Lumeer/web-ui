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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {UserModel} from '../../../core/store/users/user.model';
import {Role} from '../../../core/model/role';
import {ResourceType} from '../../../core/model/resource-type';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Subject, Subscription} from 'rxjs';
import {debounceTime, filter} from 'rxjs/operators';
import {deepArrayEquals} from '../../utils/array.utils';
import {isNullOrUndefined} from 'util';
import {NotificationService} from '../../../core/notifications/notification.service';

@Component({
  selector: '[user]',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit, OnDestroy {
  @Input() public resourceType: ResourceType;

  @Input() public editable: boolean;

  @Input() public changeRoles: boolean;

  @Input() public user: UserModel;

  @Input() public expanded: boolean;

  @Input() public userRoles: string[];

  @Input() public groupRoles: string[];

  @Output() public expandedChange = new EventEmitter();

  @Output() public userUpdated = new EventEmitter<UserModel>();

  @Output() public userDeleted = new EventEmitter<UserModel>();

  @Output() public rolesUpdate = new EventEmitter<{roles: string[]; onlyStore: boolean}>();

  private lastSyncedUserRoles: string[];
  private rolesChange$ = new Subject<string[]>();
  private rolesChangeSubscription: Subscription;

  constructor(private i18n: I18n, private notificationService: NotificationService) {}

  public ngOnInit() {
    this.rolesChangeSubscription = this.rolesChange$
      .pipe(
        debounceTime(2000),
        filter(newRoles => !deepArrayEquals(newRoles, this.lastSyncedUserRoles))
      )
      .subscribe(newRoles => {
        this.lastSyncedUserRoles = null;
        this.rolesUpdate.emit({roles: newRoles, onlyStore: false});
      });
  }

  public ngOnDestroy() {
    if (this.rolesChangeSubscription) {
      this.rolesChangeSubscription.unsubscribe();
    }
    if (this.lastSyncedUserRoles && !deepArrayEquals(this.userRoles, this.lastSyncedUserRoles)) {
      this.rolesUpdate.emit({roles: this.userRoles, onlyStore: false});
    }
  }

  public onDelete() {
    const message = this.i18n({id: 'users.user.delete.message', value: 'Do you want to permanently remove this user?'});
    const title = this.i18n({id: 'users.user.delete.title', value: 'Remove user?'});
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(message, title, [
      {text: noButtonText},
      {text: yesButtonText, action: () => this.deleteUser(), bold: false},
    ]);
  }

  public deleteUser() {
    this.userDeleted.emit(this.user);
  }

  public hasRole(role: Role): boolean {
    return this.userRoles.includes(role);
  }

  public toggleRole(role: string) {
    if (!this.changeRoles) {
      return;
    }

    if (isNullOrUndefined(this.lastSyncedUserRoles)) {
      this.lastSyncedUserRoles = this.userRoles;
    }

    let newRoles;
    if (this.userRoles.includes(role)) {
      newRoles = this.userRoles.filter(r => r !== role);
    } else {
      newRoles = [...this.userRoles, role];
    }
    this.rolesChange$.next(newRoles);
    this.rolesUpdate.emit({roles: newRoles, onlyStore: true});
  }
}
