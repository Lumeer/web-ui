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

import {SharedModule} from '../shared/shared.module';
import {CollectionRoutingModule} from './collection-routing.module';
import {CollectionSettingsComponent} from './settings/collection-settings.component';
import {CollectionLinkTypesComponent} from './settings/tab/link-types/collection-link-types.component';
import {CollectionAttributesComponent} from './settings/tab/attributes/collection-attributes.component';
import {CollectionUsersComponent} from './settings/tab/users/collection-users.component';
import {CollectionSettingsGuard} from './collection-settings.guard';
import {UsersModule} from '../shared/users/users.module';
import {AttributeFilterPipe} from './settings/tab/attributes/attribute-filter.pipe';
import {LinkTypeComponent} from './settings/tab/link-types/link-type/link-type.component';
import {LinkTypeFilterPipe} from './settings/tab/link-types/link-type-filter.pipe';
import {CollectionRulesComponent} from './settings/tab/rules/collection-rules.component';
import {AddRuleComponent} from './settings/common/rules/add-rule/add-rule.component';
import {SingleRuleComponent} from './settings/common/rules/single-rule/single-rule.component';
import {AddRuleFormComponent} from './settings/common/rules/add-rule-form/add-rule-form.component';
import {AutoLinkFormComponent} from './settings/common/rules/add-rule-form/auto-link-form/auto-link-form.component';
import {BlocklyFormComponent} from './settings/common/rules/add-rule-form/blockly-form/blockly-form.component';
import {NoRulesComponent} from './settings/common/rules/no-rules/no-rules.component';
import {HasCreatePipe} from './settings/common/rules/single-rule/has-create.pipe';
import {HasUpdatePipe} from './settings/common/rules/single-rule/has-update.pipe';
import {HasDeletePipe} from './settings/common/rules/single-rule/has-delete.pipe';
import {AddCollectionAttributeComponent} from './settings/tab/attributes/add/add-collection-attribute.component';
import {CollectionAttributesTableComponent} from './settings/tab/attributes/table/collection-attributes-table.component';
import {LinkTypeRulesComponent} from './settings/tab/link-types/link-type-rules/link-type-rules.component';
import {CollectionPurposeComponent} from './settings/tab/purpose/collection-purpose.component';
import {CollectionPurposeContentComponent} from './settings/tab/purpose/content/collection-purpose-content.component';
import {CollectionPurposeSelectComponent} from './settings/tab/purpose/content/select/collection-purpose-select.component';
import {CollectionPurposeFormComponent} from './settings/tab/purpose/content/form/collection-purpose-form.component';
import {CollectionPurposeTasksComponent} from './settings/tab/purpose/content/form/tasks/collection-purpose-tasks.component';
import {DataInputModule} from '../shared/data-input/data-input.module';
import {CronFormComponent} from './settings/common/rules/add-rule-form/cron-form/cron-form.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {AttributeNamesPipe} from './settings/common/rules/single-rule/attribute-names.pipe';
import {CollectionTeamsComponent} from './settings/tab/teams/collection-teams.component';
import {TeamsModule} from '../shared/teams/teams.module';
import {CollectionTabGuard} from './collection-tab.guard';
import {CronConfigurationFormComponent} from './settings/common/rules/add-rule-form/cron-form/configuration-form/cron-configuration-form.component';
import {IsDayOfWeekSelectedPipe} from './settings/common/rules/add-rule-form/cron-form/configuration-form/pipes/is-day-of-week-selected.pipe';
import {MaxIntervalByUnitPipe} from './settings/common/rules/add-rule-form/cron-form/configuration-form/pipes/max-interval-by-unit.pipe';
import {ShowDaysOfWeekPipe} from './settings/common/rules/add-rule-form/cron-form/configuration-form/pipes/show-days-of-week.pipe';
import {ShowOccurencePipe} from './settings/common/rules/add-rule-form/cron-form/configuration-form/pipes/show-occurence.pipe';

@NgModule({
  imports: [SharedModule, CollectionRoutingModule, UsersModule, DataInputModule, TooltipModule, TeamsModule],
  declarations: [
    AttributeFilterPipe,
    LinkTypeFilterPipe,
    CollectionSettingsComponent,
    CollectionUsersComponent,
    CollectionAttributesComponent,
    CollectionLinkTypesComponent,
    LinkTypeComponent,
    CollectionRulesComponent,
    AddRuleComponent,
    SingleRuleComponent,
    AddRuleFormComponent,
    AutoLinkFormComponent,
    BlocklyFormComponent,
    NoRulesComponent,
    HasCreatePipe,
    HasUpdatePipe,
    HasDeletePipe,
    AttributeNamesPipe,
    AddCollectionAttributeComponent,
    CollectionAttributesTableComponent,
    LinkTypeRulesComponent,
    CollectionPurposeComponent,
    CollectionPurposeContentComponent,
    CollectionPurposeSelectComponent,
    CollectionPurposeFormComponent,
    CollectionPurposeTasksComponent,
    CronFormComponent,
    CollectionTeamsComponent,
    CronConfigurationFormComponent,
    IsDayOfWeekSelectedPipe,
    MaxIntervalByUnitPipe,
    ShowDaysOfWeekPipe,
    ShowOccurencePipe,
  ],
  providers: [CollectionSettingsGuard, CollectionTabGuard],
})
export class CollectionModule {}
