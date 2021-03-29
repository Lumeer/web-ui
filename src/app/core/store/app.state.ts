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

import {RouterReducerState} from '@ngrx/router-store';
import {CollectionsState, initialCollectionsState} from './collections/collections.state';
import {DocumentsState, initialDocumentsState} from './documents/documents.state';
import {FileAttachmentsState, initialFileAttachmentsState} from './file-attachments/file-attachments.state';
import {GeocodingState, initialGeocodingState} from './geocoding/geocoding.state';
import {GroupsState, initialGroupsState} from './groups/groups.state';
import {initialLinkInstancesState, LinkInstancesState} from './link-instances/link-instances.state';
import {initialLinkTypesState, LinkTypesState} from './link-types/link-types.state';
import {initialMapsState, MapsState} from './maps/maps.state';
import {initialNavigationState, NavigationState} from './navigation/navigation.state';
import {initialOrganizationsState, OrganizationsState} from './organizations/organizations.state';
import {initialProjectsState, ProjectsState} from './projects/projects.state';
import {RouterStateUrl} from './router/lumeer-router-state-serializer';
import {initialTablesState, TablesState} from './tables/tables.state';
import {initialUsersState, UsersState} from './users/users.state';
import {initialViewsState, ViewsState} from './views/views.state';
import {ContactsState, initialContactsState} from './organizations/contact/contacts.state';
import {initialServiceLimitsState, ServiceLimitsState} from './organizations/service-limits/service-limits.state';
import {initialPaymentsState, PaymentsState} from './organizations/payment/payments.state';
import {ChartsState, initialChartsState} from './charts/charts.state';
import {CalendarsState, initialCalendarsState} from './calendars/calendars.state';
import {initialUserNotificationsState, UserNotificationsState} from './user-notifications/user-notifications.state';
import {GanttChartsState, initialGanttChartsState} from './gantt-charts/gantt-charts.state';
import {initialKanbansState, KanbansState} from './kanbans/kanban.state';
import {initialPivotsState, PivotsState} from './pivots/pivots.state';
import {initialSearchesState, SearchesState} from './searches/searches.state';
import {initialSequencesState, SequencesState} from './sequences/sequences.state';
import {ConstraintDataState, initialConstraintDataState} from './constraint-data/constraint-data.state';
import {initialPublicDataState, PublicDataState} from './public-data/public-data.state';
import {initialViewSettingsState, ViewSettingsState} from './view-settings/view-settings.state';
import {initialWorkflowsState, WorkflowsState} from './workflows/workflow.state';
import {initialResourceCommentsState, ResourceCommentsState} from './resource-comments/resource-comments.state';
import {initialModalsState, ModalsState} from './modals/modals.state';
import {initialUserPermissionsState, UserPermissionsState} from './user-permissions/user-permissions.state';
import {DataResourcesState, initialDataResourcesState} from './data-resources/data-resources.state';
import {AuditLogsState, initialAuditLogsState} from './audit-logs/audit-logs.state';

export interface AppState {
  collections: CollectionsState;
  documents: DocumentsState;
  fileAttachments: FileAttachmentsState;
  geocoding: GeocodingState;
  groups: GroupsState;
  linkInstances: LinkInstancesState;
  linkTypes: LinkTypesState;
  dataResources: DataResourcesState;
  maps: MapsState;
  navigation: NavigationState;
  organizations: OrganizationsState;
  contacts: ContactsState;
  serviceLimits: ServiceLimitsState;
  payments: PaymentsState;
  projects: ProjectsState;
  router: RouterReducerState<RouterStateUrl>;
  tables: TablesState;
  users: UsersState;
  views: ViewsState;
  pivots: PivotsState;
  charts: ChartsState;
  calendars: CalendarsState;
  userNotifications: UserNotificationsState;
  ganttCharts: GanttChartsState;
  kanbans: KanbansState;
  searches: SearchesState;
  sequences: SequencesState;
  constraintData: ConstraintDataState;
  publicData: PublicDataState;
  viewSettings: ViewSettingsState;
  workflows: WorkflowsState;
  resourceComments: ResourceCommentsState;
  modals: ModalsState;
  userPermissions: UserPermissionsState;
  auditLogs: AuditLogsState;
}

export function initialAppState(): AppState {
  return {
    collections: initialCollectionsState,
    documents: initialDocumentsState,
    fileAttachments: initialFileAttachmentsState,
    geocoding: initialGeocodingState,
    groups: initialGroupsState,
    linkInstances: initialLinkInstancesState,
    linkTypes: initialLinkTypesState,
    dataResources: initialDataResourcesState,
    maps: initialMapsState,
    navigation: initialNavigationState,
    organizations: initialOrganizationsState,
    contacts: initialContactsState,
    serviceLimits: initialServiceLimitsState,
    payments: initialPaymentsState,
    projects: initialProjectsState,
    router: null,
    tables: initialTablesState,
    users: initialUsersState,
    views: initialViewsState,
    pivots: initialPivotsState,
    charts: initialChartsState,
    calendars: initialCalendarsState,
    userNotifications: initialUserNotificationsState,
    ganttCharts: initialGanttChartsState,
    kanbans: initialKanbansState,
    searches: initialSearchesState,
    sequences: initialSequencesState,
    constraintData: initialConstraintDataState,
    publicData: initialPublicDataState,
    viewSettings: initialViewSettingsState,
    workflows: initialWorkflowsState,
    resourceComments: initialResourceCommentsState,
    modals: initialModalsState,
    userPermissions: initialUserPermissionsState,
    auditLogs: initialAuditLogsState,
  };
}
