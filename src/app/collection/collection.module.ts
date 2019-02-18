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
import {CollectionRoutingModule} from './collection-routing.module';
import {CollectionSettingsComponent} from './settings/collection-settings.component';
import {CollectionLinkTypesComponent} from './settings/tab/link-types/collection-link-types.component';
import {CollectionAttributesComponent} from './settings/tab/attributes/collection-attributes.component';
import {CollectionUsersComponent} from './settings/tab/users/collection-users.component';
import {CollectionSettingsGuard} from './collection-settings.guard';
import {PickerModule} from '../shared/picker/picker.module';
import {UsersModule} from '../shared/users/users.module';
import {AttributeFilterPipe} from './settings/tab/attributes/attribute-filter.pipe';
import {LinkTypeComponent} from './settings/tab/link-types/link-type/link-type.component';
import {LinkTypeFilterPipe} from './settings/tab/link-types/link-type-filter.pipe';
import {CollectionRulesComponent} from './settings/tab/rules/collection-rules.component';
import {AddRuleComponent} from './settings/tab/rules/add-rule/add-rule.component';
import {SingleRuleComponent} from './settings/tab/rules/single-rule/single-rule.component';
import {AddRuleFormComponent} from './settings/tab/rules/add-rule-form/add-rule-form.component';
import {AutoLinkFormComponent} from './settings/tab/rules/add-rule-form/auto-link-form/auto-link-form.component';
import {BlocklyFormComponent} from './settings/tab/rules/add-rule-form/blockly-form/blockly-form.component';
import {NoRulesComponent} from './settings/tab/rules/no-rules/no-rules.component';
import {BlocklyEditorComponent} from '../shared/blockly-editor/blockly-editor.component';
import {HasCreatePipe} from './settings/tab/rules/single-rule/has-create.pipe';
import {HasUpdatePipe} from './settings/tab/rules/single-rule/has-update.pipe';
import {HasDeletePipe} from './settings/tab/rules/single-rule/has-delete.pipe';

@NgModule({
  imports: [SharedModule, CollectionRoutingModule, UsersModule, PickerModule],
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
  ],
  providers: [CollectionSettingsGuard],
})
export class CollectionModule {}
