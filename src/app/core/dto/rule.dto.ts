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

import {BlocklyRuleConfiguration} from '../model/rule';

export interface RuleDto {
  name: string;
  type: string;
  timing: string;
  configuration: Record<string, any>;
}

export interface CronRuleConfigurationDto extends BlocklyRuleConfiguration {
  unit: string;
  interval: number;
  daysOfWeek: number; // stored as binary number starting with Monday as the least significant bit
  hour: number;
  occurence?: number;
  startsOn?: string;
  endsOn?: string;
  executionsLeft?: number;
  lastRun?: string;
  viewId: string;
  language: string;
}
