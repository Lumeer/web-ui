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
import {InviteUserModalComponent} from './modal/invite-user-modal.component';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {ModalService} from '../../../modal/modal.service';
import {selectUsersForWorkspace} from '../../../../core/store/users/users.state';
import {map} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {selectProjectPermissions} from '../../../../core/store/user-permissions/user-permissions.state';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';

@Component({
  selector: 'invite-user',
  templateUrl: './invite-user.component.html',
  styleUrls: ['./invite-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteUserComponent implements OnInit {
  @Input()
  public compact: boolean;

  public projectPermissions$: Observable<AllowedPermissions>;
  public isWorkspaceDefined$: Observable<boolean>;
  public projectUsers$: Observable<number>;

  constructor(private modalService: ModalService, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.projectPermissions$ = this.store$.pipe(select(selectProjectPermissions));
    this.isWorkspaceDefined$ = this.store$.pipe(
      select(selectWorkspaceWithIds),
      map(workspace => !!workspace?.organizationId && !!workspace?.projectId)
    );
    this.projectUsers$ = this.store$.pipe(
      select(selectUsersForWorkspace),
      map(users => users?.length)
    );
  }

  public onInviteUser() {
    this.modalService.show(InviteUserModalComponent, {keyboard: true, backdrop: 'static', initialState: {}});
  }
}
