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
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TooltipModule} from 'ngx-bootstrap/tooltip';

import {ResourceAttributesModule} from '../shared/attributes/resource-attributes.module';
import {DataInputModule} from '../shared/data-input/data-input.module';
import {DirectivesModule} from '../shared/directives/directives.module';
import {InputModule} from '../shared/input/input.module';
import {CollectionUploadModalModule} from '../shared/modal/collection-upload/collection-upload-modal.module';
import {PipesModule} from '../shared/pipes/pipes.module';
import {PresenterModule} from '../shared/presenter/presenter.module';
import {ResourceModule} from '../shared/resource/resource.module';
import {RulesModule} from '../shared/rules/rules.module';
import {SelectModule} from '../shared/select/select.module';
import {TeamsModule} from '../shared/teams/teams.module';
import {TopPanelModule} from '../shared/top-panel/top-panel.module';
import {UsersModule} from '../shared/users/users.module';
import {CollectionRoutingModule} from './collection-routing.module';
import {CollectionSettingsGuard} from './collection-settings.guard';
import {CollectionTabGuard} from './collection-tab.guard';
import {CollectionSettingsComponent} from './settings/collection-settings.component';
import {CollectionActivityComponent} from './settings/tab/activity/collection-activity.component';
import {CollectionAttributesComponent} from './settings/tab/attributes/collection-attributes.component';
import {CollectionLinkTypesComponent} from './settings/tab/link-types/collection-link-types.component';
import {LinkTypeFilterPipe} from './settings/tab/link-types/link-type/link-type-filter.pipe';
import {LinkTypeComponent} from './settings/tab/link-types/link-type/link-type.component';
import {CollectionPurposeComponent} from './settings/tab/purpose/collection-purpose.component';
import {CollectionPurposeContentComponent} from './settings/tab/purpose/content/collection-purpose-content.component';
import {CollectionPurposeFormComponent} from './settings/tab/purpose/content/form/collection-purpose-form.component';
import {CollectionPurposeTasksComponent} from './settings/tab/purpose/content/form/tasks/collection-purpose-tasks.component';
import {CollectionPurposeSelectComponent} from './settings/tab/purpose/content/select/collection-purpose-select.component';
import {CollectionRulesComponent} from './settings/tab/rules/collection-rules.component';
import {CollectionTeamsComponent} from './settings/tab/teams/collection-teams.component';
import {CollectionUsersComponent} from './settings/tab/users/collection-users.component';
import {CollectionUploadComponent} from './settings/upload/collection-upload.component';

@NgModule({
  imports: [
    CommonModule,
    CollectionRoutingModule,
    UsersModule,
    DataInputModule,
    TooltipModule,
    TeamsModule,
    ResourceAttributesModule,
    RulesModule,
    SelectModule,
    InputModule,
    PipesModule,
    DirectivesModule,
    ReactiveFormsModule,
    PresenterModule,
    ResourceModule,
    TopPanelModule,
    CollectionUploadModalModule,
  ],
  declarations: [
    LinkTypeFilterPipe,
    CollectionSettingsComponent,
    CollectionUsersComponent,
    CollectionAttributesComponent,
    CollectionLinkTypesComponent,
    LinkTypeComponent,
    CollectionRulesComponent,
    CollectionPurposeComponent,
    CollectionPurposeContentComponent,
    CollectionPurposeSelectComponent,
    CollectionPurposeFormComponent,
    CollectionPurposeTasksComponent,
    CollectionTeamsComponent,
    CollectionActivityComponent,
    CollectionUploadComponent,
  ],
  providers: [CollectionSettingsGuard, CollectionTabGuard],
})
export class CollectionModule {}
