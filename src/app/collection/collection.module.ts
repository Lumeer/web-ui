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
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';

import {CollectionRoutingModule} from './collection-routing.module';
import {CollectionSettingsComponent} from './settings/collection-settings.component';
import {CollectionLinkTypesComponent} from './settings/tab/link-types/collection-link-types.component';
import {CollectionAttributesComponent} from './settings/tab/attributes/collection-attributes.component';
import {CollectionUsersComponent} from './settings/tab/users/collection-users.component';
import {CollectionSettingsGuard} from './collection-settings.guard';
import {UsersModule} from '../shared/users/users.module';
import {LinkTypeComponent} from './settings/tab/link-types/link-type/link-type.component';
import {CollectionRulesComponent} from './settings/tab/rules/collection-rules.component';
import {CollectionPurposeComponent} from './settings/tab/purpose/collection-purpose.component';
import {CollectionPurposeContentComponent} from './settings/tab/purpose/content/collection-purpose-content.component';
import {CollectionPurposeSelectComponent} from './settings/tab/purpose/content/select/collection-purpose-select.component';
import {CollectionPurposeFormComponent} from './settings/tab/purpose/content/form/collection-purpose-form.component';
import {CollectionPurposeTasksComponent} from './settings/tab/purpose/content/form/tasks/collection-purpose-tasks.component';
import {DataInputModule} from '../shared/data-input/data-input.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {CollectionTeamsComponent} from './settings/tab/teams/collection-teams.component';
import {TeamsModule} from '../shared/teams/teams.module';
import {CollectionTabGuard} from './collection-tab.guard';
import {ResourceAttributesModule} from '../shared/attributes/resource-attributes.module';
import {LinkTypeFilterPipe} from './settings/tab/link-types/link-type/link-type-filter.pipe';
import {CollectionActivityComponent} from './settings/tab/activity/collection-activity.component';
import {RulesModule} from '../shared/rules/rules.module';
import {SelectModule} from '../shared/select/select.module';
import {InputModule} from '../shared/input/input.module';
import {PipesModule} from '../shared/pipes/pipes.module';
import {DirectivesModule} from '../shared/directives/directives.module';
import {PresenterModule} from '../shared/presenter/presenter.module';
import {ResourceModule} from '../shared/resource/resource.module';
import {TopPanelModule} from '../shared/top-panel/top-panel.module';
import {RedDotModule} from '../shared/red-dot/red-dot.module';

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
    RedDotModule,
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
  ],
  providers: [CollectionSettingsGuard, CollectionTabGuard],
})
export class CollectionModule {}
