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
import {environment} from '../../../environments/environment';
import {AppState, initialAppState} from './app.state';
import {calendarsReducer} from './calendars/calendars.reducer';
import {chartsReducer} from './charts/charts.reducer';
import {CollectionsEffects} from './collections/collections.effects';
import {collectionsReducer} from './collections/collections.reducer';
import {CommonEffects} from './common/common.effects';
import {DocumentsEffects} from './documents/documents.effects';
import {documentsReducer} from './documents/documents.reducer';
import {FileAttachmentsEffects} from './file-attachments/file-attachments.effects';
import {fileAttachmentsReducer} from './file-attachments/file-attachments.reducer';
import {ganttChartsReducer} from './gantt-charts/gantt-charts.reducer';
import {GeocodingEffects} from './geocoding/geocoding.effects';
import {geocodingReducer} from './geocoding/geocoding.reducer';
import {GroupsEffects} from './groups/groups.effects';
import {groupsReducer} from './groups/groups.reducer';
import {kanbansReducer} from './kanbans/kanbans.reducer';
import {LinkInstancesEffects} from './link-instances/link-instances.effects';
import {linkInstancesReducer} from './link-instances/link-instances.reducer';
import {LinkTypesEffects} from './link-types/link-types.effects';
import {linkTypesReducer} from './link-types/link-types.reducer';
import {mapsReducer} from './maps/maps.reducer';
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
import {RouterEffects} from './router/router.effects';
import {TablesEffects} from './tables/tables.effects';
import {tablesReducer} from './tables/tables.reducer';
import {UserNotificationsEffects} from './user-notifications/user-notifications.effects';
import {userNotificationsReducer} from './user-notifications/user-notifications.reducer';
import {UsersEffects} from './users/users.effects';
import {usersReducer} from './users/users.reducer';
import {VideosEffects} from './videos/videos.effects';
import {videosReducer} from './videos/videos.reducer';
import {ViewsEffects} from './views/views.effects';
import {viewsReducer} from './views/views.reducer';
import {searchesReducer} from './searches/searches.reducer';
import {SequencesEffects} from './sequences/sequences.effects';
import {sequencesReducer} from './sequences/sequences.reducer';

const reducers: ActionReducerMap<AppState> = {
  collections: collectionsReducer,
  documents: documentsReducer,
  fileAttachments: fileAttachmentsReducer,
  geocoding: geocodingReducer,
  groups: groupsReducer,
  linkInstances: linkInstancesReducer,
  linkTypes: linkTypesReducer,
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
  videos: videosReducer,
  userNotifications: userNotificationsReducer,
  ganttCharts: ganttChartsReducer,
  kanbans: kanbansReducer,
  searches: searchesReducer,
  sequences: sequencesReducer,
};

const effects = [
  CollectionsEffects,
  CommonEffects,
  DocumentsEffects,
  FileAttachmentsEffects,
  GeocodingEffects,
  GroupsEffects,
  LinkInstancesEffects,
  LinkTypesEffects,
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
  VideosEffects,
  UserNotificationsEffects,
  SequencesEffects,
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
    environment.storeDevtools
      ? StoreDevtoolsModule.instrument({maxAge: 50, name: `Lumeer NgRx Store (${location.hostname})`})
      : [],
  ],
  declarations: [],
})
export class AppStoreModule {}
