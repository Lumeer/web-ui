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
import {filter, map, take, tap} from 'rxjs/operators';
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
import {selectOrganizationsDictionary} from '../store/organizations/organizations.state';
import {selectProjectsDictionary} from '../store/projects/projects.state';
import {Project} from '../store/projects/project';
import {Organization} from '../store/organizations/organization';
import {userHasManageRoleInResource} from '../../shared/utils/resource.utils';
import {ResourceType} from '../model/resource-type';
import {NotificationsAction} from '../store/notifications/notifications.action';
import {UsersAction} from '../store/users/users.action';
import {convertUserDtoToModel} from '../store/users/user.converter';

@Injectable({
  providedIn: 'root',
})
export class PusherService implements OnDestroy {
  private pusher: any;
  private channel: any;
  private currentOrganization: Organization;
  private currentProject: Project;
  private user: User;

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
        take(1),
        tap(user => (this.user = user))
      )
      .subscribe(user => {
        this.subscribePusher(user);
      });
  }

  private subscribePusher(user: User): void {
    Pusher.logToConsole = !environment.production;
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
    this.bindFavoriteEvents();
    this.bindUserEvents();
  }

  private bindOrganizationEvents() {
    this.channel.bind('Organization:create', data => {
      this.store$.dispatch(new OrganizationsAction.CreateSuccess({organization: OrganizationConverter.fromDto(data)}));
    });
    this.channel.bind('Organization:update', data => {
      if (data.id === this.getCurrentOrganizationId()) {
        this.checkIfUserGainManage(data);
        this.checkIfUserLostManage(data, ResourceType.Organization);
      }
      this.getOrganization(data.id, oldOrganization => {
        const oldCode = oldOrganization && oldOrganization.code;
        this.store$.dispatch(
          new OrganizationsAction.UpdateSuccess({organization: OrganizationConverter.fromDto(data), oldCode})
        );
      });
    });
    this.channel.bind('Organization:remove', data => {
      this.getOrganization(data.id, oldOrganization => {
        const organizationCode = oldOrganization && oldOrganization.code;
        this.store$.dispatch(new OrganizationsAction.DeleteSuccess({organizationId: data.id, organizationCode}));
      });
    });
  }

  private getOrganization(id: string, action: (Organization) => void) {
    this.store$
      .pipe(
        select(selectOrganizationsDictionary),
        map(organizations => organizations[id]),
        take(1)
      )
      .subscribe(oldOrganization => action(oldOrganization));
  }

  private checkIfUserGainManage(resource: Organization | Project) {
    const hasManage = userHasManageRoleInResource(this.user, resource);
    const hadManageInOrg = userHasManageRoleInResource(this.user, this.currentOrganization);
    const hadManageInProj = userHasManageRoleInResource(this.user, this.currentProject);

    if (hasManage && !hadManageInOrg && !hadManageInProj) {
      this.store$.dispatch(new ProjectsAction.Get({organizationId: this.getCurrentOrganizationId(), force: true}));
      this.store$.dispatch(new CollectionsAction.Get({force: true}));
      this.store$.dispatch(new LinkTypesAction.Get({force: true}));
      this.store$.dispatch(new ViewsAction.Get({force: true}));
    }
  }

  private checkIfUserLostManage(resource: Organization | Project, type: ResourceType) {
    const hasManage = userHasManageRoleInResource(this.user, resource);
    const hadManageInOrg = userHasManageRoleInResource(this.user, this.currentOrganization);
    const hadManageInProj = userHasManageRoleInResource(this.user, this.currentProject);

    if (
      !hasManage &&
      hadManageInOrg !== hadManageInProj &&
      ((type === ResourceType.Organization && hadManageInOrg) || (type === ResourceType.Project && hadManageInProj))
    ) {
      this.store$.dispatch(new NotificationsAction.ForceRefresh());
    }
  }

  private bindProjectEvents() {
    this.channel.bind('Project:create', data => {
      this.store$.dispatch(
        new ProjectsAction.CreateSuccess({project: ProjectConverter.fromDto(data.object, data.organizationId)})
      );
    });
    this.channel.bind('Project:update', data => {
      this.getProject(data.object.id, oldProject => {
        if (data.object.id === this.getCurrentProjectId()) {
          this.checkIfUserGainManage(data.object);
          this.checkIfUserLostManage(data.object, ResourceType.Project);
        }
        const oldCode = oldProject && oldProject.code;
        this.store$.dispatch(
          new ProjectsAction.UpdateSuccess({
            project: ProjectConverter.fromDto(data.object, data.organizationId),
            oldCode,
          })
        );
      });
    });
    this.channel.bind('Project:remove', data => {
      this.getProject(data.id, oldProject => {
        const projectCode = oldProject && oldProject.code;
        this.store$.dispatch(
          new ProjectsAction.DeleteSuccess({projectId: data.id, organizationId: data.organizationId, projectCode})
        );
      });
    });
  }

  private getProject(id: string, action: (Project) => void) {
    this.store$
      .pipe(
        select(selectProjectsDictionary),
        map(projects => projects[id]),
        take(1)
      )
      .subscribe(oldProject => action(oldProject));
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
          new CollectionsAction.UpdateSuccess({
            collection: convertCollectionDtoToModel(data.object, data.correlationId),
          })
        );
      }
    });
    this.channel.bind('Collection:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new CollectionsAction.DeleteSuccess({collectionId: data.id}));
      }
    });
  }

  private bindViewEvents() {
    this.channel.bind('View:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.UpdateSuccess({view: ViewConverter.convertToModel(data.object)}));
      }
    });
    this.channel.bind('View:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.UpdateSuccess({view: ViewConverter.convertToModel(data.object)}));
      }
    });
    this.channel.bind('View:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new ViewsAction.DeleteSuccess({viewCode: data.id}) // backend sends code in id in case of View for simplicity
        );
      }
    });
  }

  private bindDocumentEvents() {
    this.channel.bind('Document:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.CreateSuccess({document: convertDocumentDtoToModel(data.object)}));
      }
    });
    this.channel.bind('Document:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.UpdateSuccess({document: convertDocumentDtoToModel(data.object)}));
      }
    });
    this.channel.bind('Document:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.DeleteSuccess({documentId: data.id}));
      }
    });
  }

  private bindLinkTypeEvents() {
    this.channel.bind('LinkType:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.CreateSuccess({linkType: LinkTypeConverter.fromDto(data.object)}));
      }
    });
    this.channel.bind('LinkType:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.UpdateSuccess({linkType: LinkTypeConverter.fromDto(data.object)}));
      }
    });
    this.channel.bind('LinkType:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.DeleteSuccess({linkTypeId: data.id}));
      }
    });
  }

  private bindLinkInstanceEvents() {
    this.channel.bind('LinkInstance:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new LinkInstancesAction.CreateSuccess({linkInstance: LinkInstanceConverter.fromDto(data.object)})
        );
      }
    });
    this.channel.bind('LinkInstance:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new LinkInstancesAction.UpdateSuccess({linkInstance: LinkInstanceConverter.fromDto(data.object)})
        );
      }
    });
    this.channel.bind('LinkInstance:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkInstancesAction.DeleteSuccess({linkInstanceId: data.id}));
      }
    });
  }

  private bindOtherEvents() {
    this.channel.bind('CompanyContact:update', data => {
      this.store$.dispatch(new ContactsAction.SetContactSuccess({contact: ContactConverter.fromDto(data)}));
    });

    this.channel.bind('ServiceLimits:update', data => {
      this.store$.dispatch(
        new ServiceLimitsAction.GetServiceLimitsSuccess({
          serviceLimits: ServiceLimitsConverter.fromDto(data.organizationId, data.object),
        })
      );
    });

    this.channel.bind('Payment:update', data => {
      this.store$.dispatch(
        new PaymentsAction.GetPaymentSuccess({payment: PaymentConverter.fromDto(data.organizationId, data.object)})
      );
    });

    this.channel.bind('UserNotification:create', data => {
      this.store$.dispatch(
        new UserNotificationsAction.UpdateSuccess({userNotification: UserNotificationConverter.fromDto(data)})
      );
    });
    this.channel.bind('UserNotification:remove', data => {
      this.store$.dispatch(new UserNotificationsAction.DeleteSuccess({id: data.id}));
    });
  }

  private bindFavoriteEvents() {
    this.channel.bind('FavoriteDocument:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.AddFavoriteSuccess({documentId: data.id}));
      }
    });
    this.channel.bind('FavoriteDocument:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.RemoveFavoriteSuccess({documentId: data.id}));
      }
    });
    this.channel.bind('FavoriteCollection:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new CollectionsAction.AddFavoriteSuccess({collectionId: data.id}));
      }
    });
    this.channel.bind('FavoriteCollection:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new CollectionsAction.RemoveFavoriteSuccess({collectionId: data.id}));
      }
    });
  }

  private bindUserEvents() {
    this.channel.bind('User:update', data => {
      if (this.isCurrentOrganization(data)) {
        this.store$.dispatch(new UsersAction.UpdateSuccess({user: convertUserDtoToModel(data.object)}));
      }
    });

    this.channel.bind('User:remove', data => {
      if (this.isCurrentOrganization(data)) {
        this.store$.dispatch(new UsersAction.DeleteSuccess({userId: data.id}));
      }
    });
  }

  private isCurrentWorkspace(data: any): boolean {
    return this.isCurrentOrganization(data) && data.projectId === this.getCurrentProjectId();
  }

  private isCurrentOrganization(data: any): boolean {
    return data.organizationId === this.getCurrentOrganizationId();
  }

  private getCurrentOrganizationId(): string {
    return this.currentOrganization && this.currentOrganization.id;
  }

  private getCurrentProjectId(): string {
    return this.currentProject && this.currentProject.id;
  }

  private subscribeToWorkspace() {
    this.store$
      .pipe(
        select(selectWorkspaceModels),
        filter(models => !!models)
      )
      .subscribe(models => {
        this.currentOrganization = models.organization;
        this.currentProject = models.project;
      });
  }

  public ngOnDestroy(): void {
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe();
    }
  }
}
