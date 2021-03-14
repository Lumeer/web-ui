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

import {Action} from '@ngrx/store';
import {from, Observable} from 'rxjs';
import {CommonAction} from '../common/common.action';
import {RuleDto} from '../../dto/rule.dto';
import {Rule, ruleTimingMap, ruleTypeMap} from '../../model/rule';
import {generateCorrelationId} from '../../../shared/utils/resource.utils';

export function createCallbackActions<T>(callback: (result: T) => void, result?: T): Action[] {
  return callback ? [new CommonAction.ExecuteCallback({callback: () => callback(result)})] : [];
}

export function emitErrorActions(error: any, onFailure?: (error: any) => void) {
  const actions: Action[] = [new CommonAction.HandleError({error})];
  if (onFailure) {
    actions.push(new CommonAction.ExecuteCallback({callback: () => onFailure(error)}));
  }
  return from(actions);
}

export function convertRulesFromDto(dto: Record<string, RuleDto>): Rule[] {
  return Object.keys(dto || {})
    .map<Rule>(
      id =>
        ({
          id,
          name: dto[id].name,
          type: ruleTypeMap[dto[id].type],
          timing: ruleTimingMap[dto[id].timing],
          configuration: dto[id].configuration,
        } as Rule)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function convertRulesToDto(model: Rule[]): Record<string, RuleDto> {
  if (!model) {
    return {};
  }

  return model.reduce((result, rule) => {
    result[rule.id || generateCorrelationId()] = {
      name: rule.name,
      type: rule.type,
      timing: rule.timing,
      configuration: rule.configuration,
    };
    return result;
  }, {});
}
