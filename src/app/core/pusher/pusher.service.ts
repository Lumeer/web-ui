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
import {User} from '../store/users/user';
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
import {convertCollectionDtoToModel} from '../store/collections/collection.converter';
import {ContactsAction} from '../store/organizations/contact/contacts.action';
import {ContactConverter} from '../store/organizations/contact/contact.converter';
import {ServiceLimitsAction} from '../store/organizations/service-limits/service-limits.action';
import {ServiceLimitsConverter} from '../store/organizations/service-limits/service-limits.converter';
import {PaymentsAction} from '../store/organizations/payment/payments.action';
import {PaymentConverter} from '../store/organizations/payment/payment.converter';
import {UserNotificationsAction} from '../store/user-notifications/user-notifications.action';
import {UserNotificationConverter} from '../store/user-notifications/user-notification.converter';
import {selectWorkspaceModels} from '../store/common/common.selectors';
import {LinkInstancesAction} from '../store/link-instances/link-instances.action';
import {LinkInstanceConverter} from '../store/link-instances/link-instance.converter';
import {LinkTypesAction} from '../store/link-types/link-types.action';
import {LinkTypeConverter} from '../store/link-types/link-type.converter';

@Injectable({
  providedIn: 'root',
})
export class PusherService implements OnDestroy {
  private pusher: any;
  private channel: any;
  private currentOrganizationId: string;
  private currentProjectId: string;

  constructor(private store$: Store<AppState>, private authService: AuthService) {
    if (environment.pusherKey) {
      this.init();
    }
  }

  public init(): void {
    this.subscribeToUser();
    this.subscribeToWorkspace();
  }

  private subscribeToUser() {
    this.store$
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user),
        take(1)
      )
      .subscribe(user => {
        this.subscribePusher(user);
      });
  }

  private subscribePusher(user: User): void {
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

    this.bindOrganizationEvents();
    this.bindProjectEvents();
    this.bindViewEvents();
    this.bindCollectionEvents();
    this.bindDocumentEvents();
    this.bindLinkTypeEvents();
    this.bindLinkInstanceEvents();
    this.bindOtherEvents();
  }

  private bindOrganizationEvents() {
    this.channel.bind('Organization:create', data => {
      console.log('Organization:create', data);
      this.store$.dispatch(new OrganizationsAction.CreateSuccess({organization: OrganizationConverter.fromDto(data)}));
    });
    this.channel.bind('Organization:update', data => {
      console.log('Organization:update', data);
      this.store$.dispatch(new OrganizationsAction.UpdateSuccess({organization: OrganizationConverter.fromDto(data)}));
    });
    this.channel.bind('Organization:remove', data => {
      console.log('Organization:remove', data);
      this.store$.dispatch(new OrganizationsAction.DeleteSuccess({organizationId: data.id}));
    });
  }

  private bindProjectEvents() {
    this.channel.bind('Project:create', data => {
      console.log('Project:create', data, this.isCurrentOrganization(data));
      if (this.isCurrentOrganization(data)) {
        this.store$.dispatch(
          new ProjectsAction.CreateSuccess({project: ProjectConverter.fromDto(data.object, data.organizationId)})
        );
      }
    });
    this.channel.bind('Project:update', data => {
      console.log('Project:update', data, this.isCurrentOrganization(data));
      if (this.isCurrentOrganization(data)) {
        this.store$.dispatch(
          new ProjectsAction.UpdateSuccess({project: ProjectConverter.fromDto(data.object, data.organizationId)})
        );
      }
    });
    this.channel.bind('Project:remove', data => {
      console.log('Project:remove', data, this.isCurrentOrganization(data));
      if (this.isCurrentOrganization(data)) {
        this.store$.dispatch(new ProjectsAction.DeleteSuccess({projectId: data.id}));
      }
    });
  }

  private isCurrentOrganization(data: any): boolean {
    return data.organizationId === this.currentOrganizationId;
  }

  private bindCollectionEvents() {
    this.channel.bind('Collection:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new CollectionsAction.CreateSuccess({
            collection: convertCollectionDtoToModel(data.object, data.correlationId),
          })
        );
      }
    });
    this.channel.bind('Collection:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new CollectionsAction.UpdateSuccess({collection: convertCollectionDtoToModel(data.object, data.correlationId)})
        );
      }
    });
    this.channel.bind('Collection:remove', data => {
      console.log('Collection:remove', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new CollectionsAction.DeleteSuccess({collectionId: data.id}));
      }
    });
  }

  private bindViewEvents() {
    this.channel.bind('View:create', data => {
      console.log('View:create', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.UpdateSuccess({view: ViewConverter.convertToModel(data.object)}));
      }
    });
    this.channel.bind('View:update', data => {
      console.log('View:update', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.UpdateSuccess({view: ViewConverter.convertToModel(data.object)}));
      }
    });
    this.channel.bind('View:remove', data => {
      console.log('View:remove', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new ViewsAction.DeleteSuccess({viewCode: data.id}) // backend sends code in id in case of View for simplicity
        );
      }
    });
  }

  private bindDocumentEvents() {
    this.channel.bind('Document:create', data => {
      console.log('Document:create', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.CreateSuccess({document: convertDocumentDtoToModel(data.object)}));
      }
    });
    this.channel.bind('Document:update', data => {
      console.log('Document:update', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.UpdateSuccess({document: convertDocumentDtoToModel(data.object)}));
      }
    });
    this.channel.bind('Document:remove', data => {
      console.log('Document:remove', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.DeleteSuccess({documentId: data.id}));
      }
    });
  }

  private bindLinkTypeEvents() {
    this.channel.bind('LinkType:create', data => {
      console.log('LinkType:create', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.CreateSuccess({linkType: LinkTypeConverter.fromDto(data.object)}));
      }
    });
    this.channel.bind('LinkType:update', data => {
      console.log('LinkType:update', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.UpdateSuccess({linkType: LinkTypeConverter.fromDto(data.object)}));
      }
    });
    this.channel.bind('LinkType:remove', data => {
      console.log('LinkType:remove', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.DeleteSuccess({linkTypeId: data.id}));
      }
    });
  }

  private bindLinkInstanceEvents() {
    this.channel.bind('LinkInstance:create', data => {
      console.log('LinkInstance:create', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new LinkInstancesAction.CreateSuccess({linkInstance: LinkInstanceConverter.fromDto(data.object)})
        );
      }
    });
    this.channel.bind('LinkInstance:update', data => {
      console.log('LinkInstance:update', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new LinkInstancesAction.UpdateSuccess({linkInstance: LinkInstanceConverter.fromDto(data.object)})
        );
      }
    });
    this.channel.bind('LinkInstance:remove', data => {
      console.log('LinkInstance:remove', data, this.isCurrentWorkspace(data));
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkInstancesAction.DeleteSuccess({linkInstanceId: data.id}));
      }
    });
  }

  private bindOtherEvents() {
    this.channel.bind('CompanyContact:update', data => {
      console.log('CompanyContact:update', data, this.isCurrentOrganization(data));
      this.store$.dispatch(new ContactsAction.SetContactSuccess({contact: ContactConverter.fromDto(data)}));
    });

    this.channel.bind('ServiceLimits:update', data => {
      console.log('ServiceLimits:update', data, this.isCurrentOrganization(data));
      this.store$.dispatch(
        new ServiceLimitsAction.GetServiceLimitsSuccess({
          serviceLimits: ServiceLimitsConverter.fromDto(data.organizationId, data.object),
        })
      );
    });

    this.channel.bind('Payment:update', data => {
      console.log('Payment:update', data, this.isCurrentOrganization(data));
      this.store$.dispatch(
        new PaymentsAction.GetPaymentSuccess({payment: PaymentConverter.fromDto(data.organizationId, data.object)})
      );
    });

    this.channel.bind('UserNotification:create', data => {
      console.log('UserNotification:create', data, this.isCurrentWorkspace(data));
      this.store$.dispatch(
        new UserNotificationsAction.UpdateSuccess({userNotification: UserNotificationConverter.fromDto(data)})
      );
    });
    this.channel.bind('UserNotification:remove', data => {
      this.store$.dispatch(new UserNotificationsAction.DeleteSuccess({id: data.id}));
    });
  }

  private isCurrentWorkspace(data: any): boolean {
    return data.organizationId === this.currentOrganizationId && data.projectId === this.currentProjectId;
  }

  private subscribeToWorkspace() {
    this.store$
      .pipe(
        select(selectWorkspaceModels),
        filter(models => !!models)
      )
      .subscribe(models => {
        this.currentOrganizationId = models.organization && models.organization.id;
        this.currentProjectId = models.project && models.project.id;
      });
  }

  public ngOnDestroy(): void {
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe();
    }
  }
}
