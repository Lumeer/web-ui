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
import {NgModule} from '@angular/core';

import {EffectsModule} from '@ngrx/effects';
import {routerReducer} from '@ngrx/router-store';
import {ActionReducerMap, StoreModule} from '@ngrx/store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';

import {configuration} from '../../../environments/configuration';
import {appPropertiesReducer} from './app-properties/app-properties.reducer';
import {AppState, initialAppState} from './app.state';
import {AuditLogsEffects} from './audit-logs/audit-logs.effects';
import {auditLogsReducer} from './audit-logs/audit-logs.reducer';
import {calendarsReducer} from './calendars/calendars.reducer';
import {chartsReducer} from './charts/charts.reducer';
import {CollectionsEffects} from './collections/collections.effects';
import {collectionsReducer} from './collections/collections.reducer';
import {CommonEffects} from './common/common.effects';
import {constraintDataReducer} from './constraint-data/constraint-data.reducer';
import {DashboardDataEffects} from './dashboard-data/dashboard-data.effects';
import {dashboardDataReducer} from './dashboard-data/dashboard-data.reducer';
import {DataResourcesEffects} from './data-resources/data-resources.effects';
import {dataResourcesReducer} from './data-resources/data-resources.reducer';
import {detailsReducer} from './details/detail.reducer';
import {DocumentsEffects} from './documents/documents.effects';
import {documentsReducer} from './documents/documents.reducer';
import {FileAttachmentsEffects} from './file-attachments/file-attachments.effects';
import {fileAttachmentsReducer} from './file-attachments/file-attachments.reducer';
import {formsReducer} from './form/form.reducer';
import {ganttChartsReducer} from './gantt-charts/gantt-charts.reducer';
import {GeocodingEffects} from './geocoding/geocoding.effects';
import {geocodingReducer} from './geocoding/geocoding.reducer';
import {InformationRecordsEffects} from './information-store/information-records.effects';
import {kanbansReducer} from './kanbans/kanbans.reducer';
import {LinkInstancesEffects} from './link-instances/link-instances.effects';
import {linkInstancesReducer} from './link-instances/link-instances.reducer';
import {LinkTypesEffects} from './link-types/link-types.effects';
import {linkTypesReducer} from './link-types/link-types.reducer';
import {MapsEffects} from './maps/maps.effects';
import {mapsReducer} from './maps/maps.reducer';
import {ModalsEffects} from './modals/modals.effects';
import {modalsReducer} from './modals/modals.reducer';
import {NavigationEffects} from './navigation/navigation.effects';
import {navigationReducer} from './navigation/navigation.reducer';
import {NotificationsEffects} from './notifications/notifications.effects';
import {ContactsEffects} from './organizations/contact/contacts.effects';
import {contactsReducer} from './organizations/contact/contacts.reducer';
import {OrganizationsEffects} from './organizations/organizations.effects';
import {organizationsReducer} from './organizations/organizations.reducer';
import {PaymentsEffects} from './organizations/payment/payments.effects';
import {paymentsReducer} from './organizations/payment/payments.reducer';
import {ServiceLimitsEffects} from './organizations/service-limits/service-limits.effects';
import {serviceLimitsReducer} from './organizations/service-limits/service-limits.reducer';
import {pivotsReducer} from './pivots/pivots.reducer';
import {ProjectsEffects} from './projects/projects.effects';
import {projectsReducer} from './projects/projects.reducer';
import {publicDataReducer} from './public-data/public-data.reducer';
import {ResourceCommentsEffects} from './resource-comments/resource-comments.effects';
import {resourceCommentsReducer} from './resource-comments/resource-comments.reducer';
import {ResourceVariablesEffects} from './resource-variables/resource-variables.effects';
import {resourceVariablesReducer} from './resource-variables/resource-variables.reducer';
import {ResourcesEffects} from './resources/data-resources.effects';
import {resourcesReducer} from './resources/data-resources.reducer';
import {RouterEffects} from './router/router.effects';
import {searchesReducer} from './searches/searches.reducer';
import {SelectionListsEffects} from './selection-lists/selection-lists.effects';
import {selectionListsReducer} from './selection-lists/selection-lists.reducer';
import {SequencesEffects} from './sequences/sequences.effects';
import {sequencesReducer} from './sequences/sequences.reducer';
import {TablesEffects} from './tables/tables.effects';
import {tablesReducer} from './tables/tables.reducer';
import {TeamsEffects} from './teams/teams.effects';
import {teamsReducer} from './teams/teams.reducer';
import {UserNotificationsEffects} from './user-notifications/user-notifications.effects';
import {userNotificationsReducer} from './user-notifications/user-notifications.reducer';
import {userPermissionsReducer} from './user-permissions/user-permissions.reducer';
import {UsersEffects} from './users/users.effects';
import {usersReducer} from './users/users.reducer';
import {viewSettingsReducer} from './view-settings/view-settings.reducer';
import {ViewsEffects} from './views/views.effects';
import {viewsReducer} from './views/views.reducer';
import {WorkflowsEffects} from './workflows/workflows.effects';
import {workflowsReducer} from './workflows/workflows.reducer';

const reducers: ActionReducerMap<AppState> = {
  collections: collectionsReducer,
  documents: documentsReducer,
  fileAttachments: fileAttachmentsReducer,
  geocoding: geocodingReducer,
  teams: teamsReducer,
  linkInstances: linkInstancesReducer,
  linkTypes: linkTypesReducer,
  dataResources: dataResourcesReducer,
  maps: mapsReducer,
  navigation: navigationReducer,
  organizations: organizationsReducer,
  contacts: contactsReducer,
  serviceLimits: serviceLimitsReducer,
  payments: paymentsReducer,
  projects: projectsReducer,
  router: routerReducer,
  tables: tablesReducer,
  users: usersReducer,
  views: viewsReducer,
  pivots: pivotsReducer,
  charts: chartsReducer,
  calendars: calendarsReducer,
  userNotifications: userNotificationsReducer,
  ganttCharts: ganttChartsReducer,
  kanbans: kanbansReducer,
  searches: searchesReducer,
  details: detailsReducer,
  forms: formsReducer,
  sequences: sequencesReducer,
  constraintData: constraintDataReducer,
  publicData: publicDataReducer,
  viewSettings: viewSettingsReducer,
  workflows: workflowsReducer,
  resourceComments: resourceCommentsReducer,
  modals: modalsReducer,
  userPermissions: userPermissionsReducer,
  auditLogs: auditLogsReducer,
  selectionLists: selectionListsReducer,
  dashboardData: dashboardDataReducer,
  variables: resourceVariablesReducer,
  properties: appPropertiesReducer,
  resources: resourcesReducer,
};

const effects = [
  CollectionsEffects,
  CommonEffects,
  DocumentsEffects,
  FileAttachmentsEffects,
  GeocodingEffects,
  TeamsEffects,
  LinkInstancesEffects,
  LinkTypesEffects,
  DataResourcesEffects,
  NavigationEffects,
  NotificationsEffects,
  OrganizationsEffects,
  ContactsEffects,
  ServiceLimitsEffects,
  PaymentsEffects,
  ProjectsEffects,
  RouterEffects,
  TablesEffects,
  UsersEffects,
  ViewsEffects,
  UserNotificationsEffects,
  SequencesEffects,
  MapsEffects,
  ResourceCommentsEffects,
  ModalsEffects,
  WorkflowsEffects,
  AuditLogsEffects,
  SelectionListsEffects,
  DashboardDataEffects,
  ResourceVariablesEffects,
  ResourcesEffects,
  InformationRecordsEffects,
];

@NgModule({
  imports: [
    StoreModule.forRoot(reducers, {
      initialState: initialAppState,
      runtimeChecks: {
        strictActionImmutability: true,
        strictStateImmutability: true,
      },
    }),
    EffectsModule.forRoot(effects),
    configuration.storeDevtools
      ? StoreDevtoolsModule.instrument({maxAge: 50, name: `Lumeer NgRx Store (${location.hostname})`})
      : [],
  ],
  declarations: [],
})
export class AppStoreModule {}
