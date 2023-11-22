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

import {AppPropertiesState, initialAppPropertiesState} from './app-properties/app-properties.state';
import {AuditLogsState, initialAuditLogsState} from './audit-logs/audit-logs.state';
import {CalendarsState, initialCalendarsState} from './calendars/calendars.state';
import {ChartsState, initialChartsState} from './charts/charts.state';
import {CollectionsState, initialCollectionsState} from './collections/collections.state';
import {ConstraintDataState, initialConstraintDataState} from './constraint-data/constraint-data.state';
import {DashboardDataState, initialDashboardDataState} from './dashboard-data/dashboard-data.state';
import {DataResourcesState, initialDataResourcesState} from './data-resources/data-resources.state';
import {DetailsState, initialDetailsState} from './details/detail.state';
import {DocumentsState, initialDocumentsState} from './documents/documents.state';
import {FileAttachmentsState, initialFileAttachmentsState} from './file-attachments/file-attachments.state';
import {FormsState, initialFormsState} from './form/form.state';
import {GanttChartsState, initialGanttChartsState} from './gantt-charts/gantt-charts.state';
import {GeocodingState, initialGeocodingState} from './geocoding/geocoding.state';
import {KanbansState, initialKanbansState} from './kanbans/kanban.state';
import {LinkInstancesState, initialLinkInstancesState} from './link-instances/link-instances.state';
import {LinkTypesState, initialLinkTypesState} from './link-types/link-types.state';
import {MapsState, initialMapsState} from './maps/maps.state';
import {ModalsState, initialModalsState} from './modals/modals.state';
import {NavigationState, initialNavigationState} from './navigation/navigation.state';
import {ContactsState, initialContactsState} from './organizations/contact/contacts.state';
import {OrganizationsState, initialOrganizationsState} from './organizations/organizations.state';
import {PaymentsState, initialPaymentsState} from './organizations/payment/payments.state';
import {ServiceLimitsState, initialServiceLimitsState} from './organizations/service-limits/service-limits.state';
import {PivotsState, initialPivotsState} from './pivots/pivots.state';
import {ProjectsState, initialProjectsState} from './projects/projects.state';
import {PublicDataState, initialPublicDataState} from './public-data/public-data.state';
import {ResourceCommentsState, initialResourceCommentsState} from './resource-comments/resource-comments.state';
import {ResourceVariablesState, initialResourceVariablesState} from './resource-variables/resource-variables.state';
import {ResourcesState, initialResourcesState} from './resources/data-resources.state';
import {RouterStateUrl} from './router/lumeer-router-state-serializer';
import {SearchesState, initialSearchesState} from './searches/searches.state';
import {SelectionListsState, initialSelectionListsState} from './selection-lists/selection-lists.state';
import {SequencesState, initialSequencesState} from './sequences/sequences.state';
import {TablesState, initialTablesState} from './tables/tables.state';
import {TeamsState, initialTeamsState} from './teams/teams.state';
import {UserNotificationsState, initialUserNotificationsState} from './user-notifications/user-notifications.state';
import {UserPermissionsState, initialUserPermissionsState} from './user-permissions/user-permissions.state';
import {UsersState, initialUsersState} from './users/users.state';
import {ViewSettingsState, initialViewSettingsState} from './view-settings/view-settings.state';
import {ViewsState, initialViewsState} from './views/views.state';
import {WorkflowsState, initialWorkflowsState} from './workflows/workflow.state';

export interface AppState {
  collections: CollectionsState;
  documents: DocumentsState;
  fileAttachments: FileAttachmentsState;
  geocoding: GeocodingState;
  teams: TeamsState;
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
  details: DetailsState;
  forms: FormsState;
  sequences: SequencesState;
  constraintData: ConstraintDataState;
  publicData: PublicDataState;
  viewSettings: ViewSettingsState;
  workflows: WorkflowsState;
  resourceComments: ResourceCommentsState;
  modals: ModalsState;
  userPermissions: UserPermissionsState;
  auditLogs: AuditLogsState;
  selectionLists: SelectionListsState;
  dashboardData: DashboardDataState;
  variables: ResourceVariablesState;
  properties: AppPropertiesState;
  resources: ResourcesState;
}

export function initialAppState(): AppState {
  return {
    collections: initialCollectionsState,
    documents: initialDocumentsState,
    fileAttachments: initialFileAttachmentsState,
    geocoding: initialGeocodingState,
    teams: initialTeamsState,
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
    details: initialDetailsState,
    forms: initialFormsState,
    sequences: initialSequencesState,
    constraintData: initialConstraintDataState,
    publicData: initialPublicDataState,
    viewSettings: initialViewSettingsState,
    workflows: initialWorkflowsState,
    resourceComments: initialResourceCommentsState,
    modals: initialModalsState,
    userPermissions: initialUserPermissionsState,
    auditLogs: initialAuditLogsState,
    selectionLists: initialSelectionListsState,
    dashboardData: initialDashboardDataState,
    variables: initialResourceVariablesState,
    properties: initialAppPropertiesState,
    resources: initialResourcesState,
  };
}
