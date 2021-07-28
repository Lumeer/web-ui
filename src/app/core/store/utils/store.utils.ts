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
import {from} from 'rxjs';
import {CommonAction} from '../common/common.action';
import {generateCorrelationId} from '../../../shared/utils/resource.utils';
import {chronoUnitMap, CronRuleConfiguration, Rule, ruleTimingMap, RuleType, ruleTypeMap} from '../../model/rule';
import {CronRuleConfigurationDto, RuleDto} from '../../dto/rule.dto';
import {convertQueryDtoToModel, convertQueryModelToDto} from '../navigation/query/query.converter';
import {languageCodeMap} from '../../../shared/top-panel/user-panel/user-menu/language';

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
          configuration:
            ruleTypeMap[dto[id].type] === RuleType.Cron
              ? convertCronRuleConfigurationDtoToModel(dto[id].configuration as CronRuleConfigurationDto)
              : dto[id].configuration,
        } as Rule)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

function convertCronRuleConfigurationDtoToModel(dto: CronRuleConfigurationDto): CronRuleConfiguration {
  return {
    ...dto, // get blockly config
    since: dto.since && new Date(dto.since),
    until: dto.until && new Date(dto.until),
    when: dto.when,
    interval: dto.interval,
    dow: dto.dow, // days of week - stored as binary number starting with Monday as the least significant bit
    occurence: dto.occurence,
    lastRun: dto.lastRun,
    unit: chronoUnitMap[dto.unit],
    executing: dto.executing,
    query: convertQueryDtoToModel(dto.query),
    language: languageCodeMap[dto.language],
  };
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
      configuration:
        rule.type === RuleType.Cron ? convertCronRuleConfigurationModelToDto(rule.configuration) : rule.configuration,
    };
    return result;
  }, {});
}

function convertCronRuleConfigurationModelToDto(model: CronRuleConfiguration): CronRuleConfigurationDto {
  return {
    ...model, // to convert blockly part
    since: model.since?.toISOString(),
    until: model.until?.toISOString(),
    when: model.when,
    interval: model.interval,
    dow: model.dow,
    occurence: model.occurence,
    lastRun: model.lastRun,
    unit: model.unit,
    executing: model.executing,
    query: convertQueryModelToDto(model.query),
    language: model.language,
  };
}
