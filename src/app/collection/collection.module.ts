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

import {SharedModule} from '../shared/shared.module';
import {CollectionListComponent} from './list/collection-list.component';
import {CollectionComponent} from './collection.component';
import {CollectionRoutingModule} from './collection-routing.module';
import {CollectionSettingsComponent} from './settings/collection-settings.component';
import {CollectionLinkTypesComponent} from './settings/tab/link-types/collection-link-types.component';
import {CollectionAttributesComponent} from './settings/tab/attributes/collection-attributes.component';
import {CollectionUsersComponent} from './settings/tab/users/collection-users.component';
import {CollectionEventsComponent} from './settings/tab/events/collection-events.component';
import {CollectionSettingsGuard} from './collection-settings.guard';
import {LinkAttributeListComponent} from './settings/tab/link-attribute-list/link-attribute-list.component';
import {AttributeListComponent} from './settings/tab/attribute-list/attribute-list.component';
import {CollectionTabComponent} from './settings/tab/collection-tab.component';
import {PickerModule} from '../shared/picker/picker.module';
import {UsersModule} from '../shared/users/users.module';

@NgModule({
  imports: [
    SharedModule,
    CollectionRoutingModule,
    UsersModule,
    PickerModule
  ],
  declarations: [
    AttributeListComponent,
    LinkAttributeListComponent,
    CollectionComponent,
    CollectionTabComponent,
    CollectionListComponent,
    CollectionSettingsComponent,
    CollectionUsersComponent,
    CollectionAttributesComponent,
    CollectionEventsComponent,
    CollectionLinkTypesComponent
  ],
  providers: [
    CollectionSettingsGuard
  ]
})
export class CollectionModule {

}
