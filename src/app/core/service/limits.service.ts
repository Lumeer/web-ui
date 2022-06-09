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

import {Injectable} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectCurrentUser} from '../store/users/users.state';
import {selectOrganizationByWorkspace} from '../store/organizations/organizations.state';
import {map, take} from 'rxjs/operators';
import {userHasRoleInOrganization} from '../../shared/utils/permission.utils';
import {RoleType} from '../model/role-type';
import {Organization} from '../store/organizations/organization';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {NotificationsAction} from '../store/notifications/notifications.action';
import {AppState} from '../store/app.state';
import {User} from '../store/users/user';

@Injectable({
  providedIn: 'root',
})
export class LimitsService {
  constructor(private store$: Store<AppState>) {}

  public notifyTablesLimit() {
    this.selectLimitsData$().subscribe(({currentUser, organization}) => {
      if (userHasRoleInOrganization(organization, currentUser, RoleType.Manage)) {
        this.notifyTablesLimitWithRedirect(organization);
      } else {
        this.notifyTablesLimitWithoutRights();
      }
    });
  }

  private selectLimitsData$(): Observable<{currentUser: User; organization: Organization}> {
    return combineLatest([
      this.store$.pipe(select(selectCurrentUser)),
      this.store$.pipe(select(selectOrganizationByWorkspace)),
    ]).pipe(
      map(([currentUser, organization]) => ({currentUser, organization})),
      take(1)
    );
  }

  private notifyTablesLimitWithRedirect(organization: Organization) {
    const message = $localize`:@@collection.create.serviceLimits:You are currently on the Free plan which allows you to have only limited number of tables. Do you want to upgrade to Business now?`;
    this.store$.dispatch(new OrganizationsAction.OfferPayment({message, organizationCode: organization.code}));
  }

  private notifyTablesLimitWithoutRights() {
    const title = $localize`:@@serviceLimits.trial:Free Service`;
    const message = $localize`:@@collection.create.serviceLimits.noRights:You are currently on the Free plan which allows you to have only limited number of tables.`;
    this.store$.dispatch(new NotificationsAction.Info({title, message}));
  }

  public notifyFunctionsLimit() {
    this.selectLimitsData$().subscribe(({currentUser, organization}) => {
      if (userHasRoleInOrganization(organization, currentUser, RoleType.Manage)) {
        this.notifyFunctionsLimitWithRedirect(organization);
      } else {
        this.notifyFunctionsLimitWithoutRights();
      }
    });
  }

  private notifyFunctionsLimitWithRedirect(organization: Organization) {
    const message = $localize`:@@function.create.serviceLimits:You can have only a single function per table/link type in the Free Plan. Do you want to upgrade to Business now?`;
    this.store$.dispatch(new OrganizationsAction.OfferPayment({message, organizationCode: organization.code}));
  }

  private notifyFunctionsLimitWithoutRights() {
    const title = $localize`:@@serviceLimits.trial:Free Service`;
    const message = $localize`:@@function.create.serviceLimits.noRights:You can have only a single function per table/link type in the Free Plan.`;
    this.store$.dispatch(new NotificationsAction.Info({title, message}));
  }
}
