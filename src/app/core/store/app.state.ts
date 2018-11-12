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

import {RouterReducerState} from '@ngrx/router-store';
import {CollectionsState, initialCollectionsState} from './collections/collections.state';
import {DocumentsState, initialDocumentsState} from './documents/documents.state';
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
import {initialPostItState, PostItState} from './postit/postit.state';
import {ChartsState, initialChartsState} from './charts/charts.state';

export interface AppState {
  collections: CollectionsState;
  documents: DocumentsState;
  groups: GroupsState;
  linkInstances: LinkInstancesState;
  linkTypes: LinkTypesState;
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
  postIts: PostItState;
  charts: ChartsState;
}

export function initialAppState(): AppState {
  return {
    collections: initialCollectionsState,
    documents: initialDocumentsState,
    groups: initialGroupsState,
    linkInstances: initialLinkInstancesState,
    linkTypes: initialLinkTypesState,
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
    postIts: initialPostItState,
    charts: initialChartsState,
  };
}
