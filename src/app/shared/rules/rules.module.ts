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
import {PipesModule} from '../pipes/pipes.module';
import {AddRuleComponent} from './add-rule/add-rule.component';
import {AddRuleFormComponent} from './add-rule-form/add-rule-form.component';
import {CronFormComponent} from './add-rule-form/cron-form/cron-form.component';
import {CronConfigurationFormComponent} from './add-rule-form/cron-form/configuration-form/cron-configuration-form.component';
import {BlocklyFormComponent} from './add-rule-form/blockly-form/blockly-form.component';
import {AutoLinkFormComponent} from './add-rule-form/auto-link-form/auto-link-form.component';
import {SingleRuleComponent} from './single-rule/single-rule.component';
import {HasUpdatePipe} from './single-rule/pipes/has-update.pipe';
import {HasDeletePipe} from './single-rule/pipes/has-delete.pipe';
import {HasCreatePipe} from './single-rule/pipes/has-create.pipe';
import {AttributeNamesPipe} from './single-rule/pipes/attribute-names.pipe';
import {ShowOccurrencePipe} from './add-rule-form/cron-form/configuration-form/pipes/show-occurrence.pipe';
import {MaxIntervalByUnitPipe} from './add-rule-form/cron-form/configuration-form/pipes/max-interval-by-unit.pipe';
import {ShowDaysOfWeekPipe} from './add-rule-form/cron-form/configuration-form/pipes/show-days-of-week.pipe';
import {IsDayOfWeekSelectedPipe} from './add-rule-form/cron-form/configuration-form/pipes/is-day-of-week-selected.pipe';
import {NoRulesComponent} from './no-rules/no-rules.component';
import {BlocklyModule} from '../blockly/blockly.module';
import {SelectModule} from '../select/select.module';
import {InputModule} from '../input/input.module';
import {DirectivesModule} from '../directives/directives.module';
import {DateTimeModule} from '../date-time/date-time.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {RuleRunInfoPipe} from './single-rule/pipes/rule-run-info.pipe';
import {RuleRunInfoComponent} from './common/rule-run-info/rule-run-info.component';

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    BlocklyModule,
    SelectModule,
    ReactiveFormsModule,
    InputModule,
    DirectivesModule,
    DateTimeModule,
    TooltipModule,
  ],
  declarations: [
    AddRuleComponent,
    AddRuleFormComponent,
    CronFormComponent,
    CronConfigurationFormComponent,
    BlocklyFormComponent,
    AutoLinkFormComponent,
    SingleRuleComponent,
    NoRulesComponent,
    HasUpdatePipe,
    HasDeletePipe,
    HasCreatePipe,
    AttributeNamesPipe,
    ShowOccurrencePipe,
    MaxIntervalByUnitPipe,
    ShowDaysOfWeekPipe,
    IsDayOfWeekSelectedPipe,
    RuleRunInfoPipe,
    RuleRunInfoComponent,
  ],
  exports: [AddRuleComponent, SingleRuleComponent, AddRuleFormComponent, NoRulesComponent],
})
export class RulesModule {}
