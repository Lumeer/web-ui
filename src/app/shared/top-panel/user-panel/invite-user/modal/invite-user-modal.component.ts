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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {DialogType} from '../../../../modal/dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable} from 'rxjs';
import {AppState} from '../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectAllUsers} from '../../../../../core/store/users/users.state';
import {map, take} from 'rxjs/operators';
import {InvitationType} from '../../../../../core/model/invitation-type';
import {UsersAction} from '../../../../../core/store/users/users.action';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {
  selectOrganizationPermissions,
  selectProjectPermissions,
} from '../../../../../core/store/user-permissions/user-permissions.state';
import {UserInvitation} from '../../../../../core/model/user-invitation';
import {selectWorkspaceWithIds} from '../../../../../core/store/common/common.selectors';

@Component({
  templateUrl: './invite-user-modal.component.html',
  styleUrls: ['./invite-user-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteUserModalComponent implements OnInit {
  public readonly dialogType = DialogType;

  public performingAction$ = new BehaviorSubject(false);
  public newUsers$ = new BehaviorSubject<string[]>([]);
  public existingUsers$: Observable<string[]>;

  public organizationPermissions$: Observable<AllowedPermissions>;
  public projectPermissions$: Observable<AllowedPermissions>;

  public accessType = InvitationType.JoinOnly;

  public readonly invitationType = InvitationType;

  public stage = 0;

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.existingUsers$ = this.store$.pipe(
      select(selectAllUsers),
      map(users => users.map(u => u.email))
    );

    this.organizationPermissions$ = this.store$.pipe(select(selectOrganizationPermissions));
    this.projectPermissions$ = this.store$.pipe(select(selectProjectPermissions));
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public onSubmit() {
    if (this.stage === 0) {
      this.stage = 1;
    } else {
      this.finalSubmit();
    }
  }

  public finalSubmit() {
    this.performingAction$.next(true);

    this.store$.pipe(select(selectWorkspaceWithIds), take(1)).subscribe(workspace => {
      const invitations: UserInvitation[] = this.newUsers$.getValue().map(email => ({email, type: this.accessType}));
      this.store$.dispatch(
        new UsersAction.InviteUsers({
          organizationId: workspace.organizationId,
          projectId: workspace.projectId,
          invitations,
          onSuccess: () => this.hideDialog(),
          onFailure: () => this.onFailure(),
        })
      );
    });
  }

  private onFailure() {
    this.performingAction$.next(false);
  }

  public onAddUser(userEmail: string) {
    const users = this.newUsers$.getValue();
    users.push(userEmail);
    this.newUsers$.next(users);
  }

  public onRemoveUser(user: string) {
    const users = this.newUsers$.getValue();
    this.newUsers$.next(users.filter(u => u !== user));
  }

  public onSecondarySubmit() {
    this.stage = 0;
  }
}
