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
import {DialogType} from '../../../../../dialog/dialog-type';
import {BsModalRef} from 'ngx-bootstrap';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {AppState} from '../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectAllUsers, selectUsersByEmails, selectUsersDictionary} from '../../../../../core/store/users/users.state';
import {filter, first, flatMap, map} from 'rxjs/operators';
import {InvitationType} from '../../../../../core/model/invitation-type';
import {UsersAction} from '../../../../../core/store/users/users.action';
import {User} from '../../../../../core/store/users/user';
import {selectWorkspace} from '../../../../../core/store/navigation/navigation.state';
import {selectOrganizationByWorkspace} from '../../../../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../../../../core/store/projects/projects.state';

@Component({
  selector: 'invite-user-dialog',
  templateUrl: './invite-user-dialog.component.html',
  styleUrls: ['./invite-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteUserDialogComponent implements OnInit {
  public readonly dialogType = DialogType;

  public newUsers$ = new BehaviorSubject<string[]>([]);
  public existingUsers$: Observable<string[]>;

  public accessType = InvitationType.JoinOnly;

  public readonly invitationType = InvitationType;

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit(): void {
    this.existingUsers$ = this.store$.pipe(
      select(selectAllUsers),
      map(users => users.map(u => u.email))
    );
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public onSubmit() {
    const selectedUsers = this.newUsers$.getValue();

    combineLatest([
      this.store$.pipe(select(selectOrganizationByWorkspace)),
      this.store$.pipe(select(selectProjectByWorkspace)),
      this.store$.pipe(select(selectWorkspace)),
    ])
      .pipe(
        filter(([organization, project]) => !!organization && !!project),
        first()
      )
      .subscribe(([organization, project, workspace]) => {
        this.store$.dispatch(
          new UsersAction.InviteUsers({
            organizationId: organization.id,
            projectId: project.id,
            users: selectedUsers.map(
              userEmail => ({email: userEmail, groupsMap: {}, defaultWorkspace: workspace} as User)
            ),
            invitationType: this.accessType,
          })
        );
      });

    this.hideDialog();
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
}
