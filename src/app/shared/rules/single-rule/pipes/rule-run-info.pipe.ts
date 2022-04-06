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

import {Pipe, PipeTransform} from '@angular/core';
import {Rule, RuleType} from '../../../../core/model/rule';
import {computeCronRuleNextExecution} from '../../../utils/rule.utils';

@Pipe({
  name: 'ruleRunInfo',
})
export class RuleRunInfoPipe implements PipeTransform {
  public transform(rule: Rule): {lastRun: Date; nextRun: Date} {
    if (rule?.type === RuleType.Cron) {
      return {
        lastRun: rule.configuration.lastRun,
        nextRun: computeCronRuleNextExecution(rule),
      };
    }
    return null;
  }
}
