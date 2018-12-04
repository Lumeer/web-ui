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

import {select, Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {Injectable, OnDestroy} from '@angular/core';
import {environment} from '../../../environments/environment';
import Pusher from 'pusher-js';
import {selectCurrentUser} from '../store/users/users.state';
import {UserModel} from '../store/users/user.model';
import {filter, take} from 'rxjs/operators';
import {AuthService} from '../../auth/auth.service';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {OrganizationConverter} from '../store/organizations/organization.converter';
import {DocumentsAction} from '../store/documents/documents.action';
import {convertDocumentDtoToModel} from '../store/documents/document.converter';
import {ProjectsAction} from '../store/projects/projects.action';
import {ProjectConverter} from '../store/projects/project.converter';
import {ViewsAction} from '../store/views/views.action';
import {ViewConverter} from '../store/views/view.converter';
import {CollectionsAction} from '../store/collections/collections.action';
import {CollectionConverter} from '../store/collections/collection.converter';
import {ContactsAction} from '../store/organizations/contact/contacts.action';
import {ContactConverter} from '../store/organizations/contact/contact.converter';
import {ServiceLimitsAction} from '../store/organizations/service-limits/service-limits.action';
import {ServiceLimitsConverter} from '../store/organizations/service-limits/service-limits.converter';
import {PaymentsAction} from '../store/organizations/payment/payments.action';
import {PaymentConverter} from '../store/organizations/payment/payment.converter';
import {UserNotificationsAction} from '../store/user-notifications/user-notifications.action';
import {UserNotificationConverter} from '../store/user-notifications/user-notification.converter';

@Injectable({
  providedIn: 'root',
})
export class PusherService implements OnDestroy {
  private pusher: any;
  private channel: any;

  constructor(private store: Store<AppState>, private authService: AuthService) {
    if (environment.pusherKey) {
      this.init();
    }
  }

  public init(): void {
    this.store
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user),
        take(1)
      )
      .subscribe(user => {
        this.subscribePusher(user);
      });
  }

  private subscribePusher(user: UserModel): void {
    //Pusher.logToConsole = true;
    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster,
      authEndpoint: `${environment.apiUrl}/rest/pusher`,
      auth: {
        headers: {
          Authorization: `Bearer ${this.authService.getAccessToken()}`,
        },
      },
    });

    this.channel = this.pusher.subscribe('private-' + user.id);

    this.channel.bind('Organization:create', data => {
      this.store.dispatch(new OrganizationsAction.CreateSuccess({organization: OrganizationConverter.fromDto(data)}));
    });
    this.channel.bind('Organization:update', data => {
      this.store.dispatch(new OrganizationsAction.UpdateSuccess({organization: OrganizationConverter.fromDto(data)}));
    });
    this.channel.bind('Organization:remove', data => {
      this.store.dispatch(new OrganizationsAction.DeleteSuccess({organizationId: data.id}));
    });

    this.channel.bind('Project:create', data => {
      this.store.dispatch(
        new ProjectsAction.CreateSuccess({project: ProjectConverter.fromDto(data.resource, data.parentId)})
      );
    });
    this.channel.bind('Project:update', data => {
      this.store.dispatch(
        new ProjectsAction.UpdateSuccess({project: ProjectConverter.fromDto(data.resource, data.parentId)})
      );
    });
    this.channel.bind('Project:remove', data => {
      this.store.dispatch(new ProjectsAction.DeleteSuccess({projectId: data.id}));
    });

    this.channel.bind('View:create', data => {
      this.store.dispatch(new ViewsAction.CreateSuccess({view: ViewConverter.convertToModel(data)}));
    });
    this.channel.bind('View:update', data => {
      this.store.dispatch(new ViewsAction.UpdateSuccess({view: ViewConverter.convertToModel(data), skipNotify: true}));
    });
    this.channel.bind('View:remove', data => {
      this.store.dispatch(
        new ViewsAction.DeleteSuccess({viewCode: data.id}) // backend sends code in id in case of View for simplicity
      );
    });

    this.channel.bind('Collection:create', data => {
      this.store.dispatch(new CollectionsAction.CreateSuccess({collection: CollectionConverter.fromDto(data)}));
    });
    this.channel.bind('Collection:update', data => {
      this.store.dispatch(new CollectionsAction.UpdateSuccess({collection: CollectionConverter.fromDto(data)}));
    });
    this.channel.bind('Collection:remove', data => {
      this.store.dispatch(new CollectionsAction.DeleteSuccess({collectionId: data.id}));
    });

    this.channel.bind('Document:create', data => {
      this.store.dispatch(new DocumentsAction.CreateSuccess({document: convertDocumentDtoToModel(data)}));
    });
    this.channel.bind('Document:update', data => {
      this.store.dispatch(new DocumentsAction.UpdateSuccess({document: convertDocumentDtoToModel(data)}));
    });
    this.channel.bind('Document:remove', data => {
      this.store.dispatch(new DocumentsAction.DeleteSuccess({documentId: data.id}));
    });

    this.channel.bind('CompanyContact:update', data => {
      this.store.dispatch(new ContactsAction.GetContactSuccess({contact: ContactConverter.fromDto(data)}));
    });

    this.channel.bind('ServiceLimits:update', data => {
      this.store.dispatch(
        new ServiceLimitsAction.GetServiceLimitsSuccess({
          serviceLimits: ServiceLimitsConverter.fromDto(data.organizationId, data.entity),
        })
      );
    });

    this.channel.bind('Payment:update', data => {
      this.store.dispatch(
        new PaymentsAction.GetPaymentSuccess({payment: PaymentConverter.fromDto(data.organizationId, data.entity)})
      );
    });

    this.channel.bind('UserNotification:create', data => {
      this.store.dispatch(
        new UserNotificationsAction.UpdateSuccess({userNotification: UserNotificationConverter.fromDto(data)})
      );
    });
  }

  public ngOnDestroy(): void {
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe();
    }
  }
}
