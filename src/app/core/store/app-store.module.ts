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

import {NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {routerReducer} from '@ngrx/router-store';
import {ActionReducerMap, StoreModule} from '@ngrx/store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '../../../environments/environment';
import {AppState, initialAppState} from './app.state';
import {CollectionsEffects} from './collections/collections.effects';
import {collectionsReducer} from './collections/collections.reducer';
import {DocumentsEffects} from './documents/documents.effects';
import {documentsReducer} from './documents/documents.reducer';
import {GroupsEffects} from './groups/groups.effects';
import {groupsReducer} from './groups/groups.reducer';
import {LinkInstancesEffects} from './link-instances/link-instances.effects';
import {linkInstancesReducer} from './link-instances/link-instances.reducer';
import {LinkTypesEffects} from './link-types/link-types.effects';
import {linkTypesReducer} from './link-types/link-types.reducer';
import {navigationReducer} from './navigation/navigation.reducer';
import {NotificationsEffects} from './notifications/notifications.effects';
import {OrganizationsEffects} from './organizations/organizations.effects';
import {organizationsReducer} from './organizations/organizations.reducer';
import {ProjectsEffects} from './projects/projects.effects';
import {projectsReducer} from './projects/projects.reducer';
import {RouterEffects} from './router/router.effects';
import {templatesReducer} from './templates/templates.reducer';
import {UsersEffects} from './users/users.effects';
import {usersReducer} from './users/users.reducer';
import {ViewsEffects} from './views/views.effects';
import {viewsReducer} from './views/views.reducer';

const reducers: ActionReducerMap<AppState> = {
  collections: collectionsReducer,
  documents: documentsReducer,
  groups: groupsReducer,
  linkInstances: linkInstancesReducer,
  linkTypes: linkTypesReducer,
  navigation: navigationReducer,
  organizations: organizationsReducer,
  projects: projectsReducer,
  router: routerReducer,
  users: usersReducer,
  views: viewsReducer,
  templates: templatesReducer
};

const effects = [
  CollectionsEffects,
  DocumentsEffects,
  GroupsEffects,
  LinkInstancesEffects,
  LinkTypesEffects,
  NotificationsEffects,
  OrganizationsEffects,
  ProjectsEffects,
  RouterEffects,
  UsersEffects,
  ViewsEffects
];

@NgModule({
  imports: [
    StoreModule.forRoot(reducers, {initialState: initialAppState}),
    EffectsModule.forRoot(effects),
    !environment.production ? StoreDevtoolsModule.instrument({maxAge: 10}) : []
  ],
  declarations: []
})
export class AppStoreModule {
}
