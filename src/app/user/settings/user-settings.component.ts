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

import {Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, combineLatest} from 'rxjs';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {User} from '../../core/store/users/user';
import {AppState} from '../../core/store/app.state';
import {selectOrganizationPermissions} from '../../core/store/user-permissions/user-permissions.state';
import {selectCurrentUser, selectUserByWorkspace} from '../../core/store/users/users.state';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {UsersAction} from '../../core/store/users/users.action';
import {Organization} from '../../core/store/organizations/organization';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {map, take} from 'rxjs/operators';
import {Team} from '../../core/store/teams/team';
import {selectTeamsForWorkspace} from '../../core/store/teams/teams.state';
import {selectServiceLimitsByWorkspace} from '../../core/store/organizations/service-limits/service-limits.state';
import {ServiceLimits} from '../../core/store/organizations/service-limits/service.limits';

@Component({
  selector: 'user-settings',
  templateUrl: './user-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent implements OnInit {
  @Output()
  public back = new EventEmitter();

  public user$: Observable<User>;
  public currentUser$: Observable<User>;
  public permissions$: Observable<AllowedPermissions>;
  public teams$: Observable<Team[]>;
  public serviceLimits$: Observable<ServiceLimits>;

  public deletedUser$ = new BehaviorSubject<User>(null);

  constructor(private router: Router, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.user$ = combineLatest([this.deletedUser$, this.store$.pipe(select(selectUserByWorkspace))]).pipe(
      map(([deletedUser, user]) => deletedUser || user)
    );
    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
    this.teams$ = this.store$.pipe(select(selectTeamsForWorkspace));
    this.serviceLimits$ = this.store$.pipe(select(selectServiceLimitsByWorkspace));
    this.permissions$ = this.store$.pipe(select(selectOrganizationPermissions));
  }

  public onDelete(user: User) {
    this.store$
      .pipe(select(selectOrganizationByWorkspace), take(1))
      .subscribe(organization => this.deleteUser(user, organization));
  }

  private deleteUser(user: User, organization: Organization) {
    const message = $localize`:@@users.user.delete.message:Do you want to permanently remove this user?`;
    const title = $localize`:@@users.user.delete.title:Remove user?`;
    const action = new UsersAction.Delete({
      organizationId: organization.id,
      userId: user.id,
      onSuccess: () => {
        this.deletedUser$.next(user);
        this.back.emit();
      },
    });

    this.store$.dispatch(
      new NotificationsAction.Confirm({
        message,
        title,
        type: 'danger',
        action,
      })
    );
  }
}
