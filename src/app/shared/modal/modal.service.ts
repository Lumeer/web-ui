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
import {select, Store} from '@ngrx/store';
import {BsModalService} from 'ngx-bootstrap';
import {AttributeTypeModalComponent} from './attribute-type/attribute-type-modal.component';
import {AppState} from '../../core/store/app.state';
import {selectServiceLimitsByWorkspace} from '../../core/store/organizations/service-limits/service-limits.state';
import {first, take} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {userHasManageRoleInResource} from '../utils/resource.utils';
import {Organization} from '../../core/store/organizations/organization';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {RouterAction} from '../../core/store/router/router.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {AttributeFunctionModalComponent} from './attribute-function/attribute-function-modal.component';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {selectLinkTypeById} from '../../core/store/link-types/link-types.state';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(private store$: Store<AppState>, private i18n: I18n, private bsModalService: BsModalService) {}

  public showAttributeType(attributeId: string, collectionId: string, linkTypeId?: string) {
    const initialState = {attributeId, collectionId, linkTypeId};
    const config = {initialState, keyboard: false};
    config['backdrop'] = 'static';
    this.bsModalService.show(AttributeTypeModalComponent, config);
  }

  public showAttributeFunction(attributeId: string, collectionId: string, linkTypeId?: string) {
    const attributesResourceObservable =
      (collectionId && this.store$.pipe(select(selectCollectionById(collectionId)))) ||
      this.store$.pipe(select(selectLinkTypeById(linkTypeId)));

    combineLatest([this.store$.pipe(select(selectServiceLimitsByWorkspace)), attributesResourceObservable])
      .pipe(first())
      .subscribe(([limits, attributesResource]) => {
        const functions = (attributesResource.attributes || []).filter(
          attr => attr.id !== attributeId && !!attr.function && !!attr.function.js
        ).length;
        if (limits && limits.functionsPerCollection !== 0 && functions >= limits.functionsPerCollection) {
          this.notifyFunctionsLimit();
        } else {
          this.showAttributeFunctionDialog(attributeId, collectionId, linkTypeId);
        }
      });
  }

  private showAttributeFunctionDialog(attributeId: string, collectionId: string, linkTypeId: string) {
    const initialState = {attributeId, collectionId, linkTypeId};
    const config = {initialState, keyboard: false, class: 'modal-xxl'};
    config['backdrop'] = 'static';
    return this.bsModalService.show(AttributeFunctionModalComponent, config);
  }

  private notifyFunctionsLimit() {
    combineLatest([
      this.store$.pipe(select(selectCurrentUser)),
      this.store$.pipe(select(selectOrganizationByWorkspace)),
    ])
      .pipe(take(1))
      .subscribe(([currentUser, organization]) => {
        if (userHasManageRoleInResource(currentUser, organization)) {
          this.notifyFunctionsLimitWithRedirect(organization);
        } else {
          this.notifyFunctionsLimitWithoutRights();
        }
      });
  }

  private notifyFunctionsLimitWithRedirect(organization: Organization) {
    const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
    const message = this.i18n({
      id: 'function.create.serviceLimits',
      value:
        'You can have only a single function per table/link type in the Free Plan. Do you want to upgrade to Business now?',
    });
    this.store$.dispatch(
      new NotificationsAction.Confirm({
        title,
        message,
        action: new RouterAction.Go({
          path: ['/organization', organization.code, 'detail'],
          extras: {fragment: 'orderService'},
        }),
        yesFirst: false,
      })
    );
  }

  private notifyFunctionsLimitWithoutRights() {
    const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
    const message = this.i18n({
      id: 'function.create.serviceLimits.noRights',
      value: 'You can have only a single function per table/link type in the Free Plan.',
    });
    this.store$.dispatch(new NotificationsAction.Info({title, message}));
  }
}
