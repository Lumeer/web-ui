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

import {Observable, of} from 'rxjs';

import {generateCorrelationId} from '../../../shared/utils/resource.utils';
import {CronRuleConfigurationDto, RuleDto} from '../../dto/rule.dto';
import {languageCodeMap} from '../../model/language';
import {
  CronRuleConfiguration,
  Rule,
  RuleConfiguration,
  RuleType,
  chronoUnitMap,
  ruleTimingMap,
  ruleTypeMap,
} from '../../model/rule';
import {CommonAction} from '../common/common.action';

export function createCallbackActions<T>(callback: (result: T) => void, result?: T): Action[] {
  return callback ? [new CommonAction.ExecuteCallback({callback: () => callback(result)})] : [];
}

export function emitErrorActions(
  error: any,
  onFailure?: (error: any) => void,
  additionalActions?: Action[]
): Observable<Action> {
  const actions: Action[] = [new CommonAction.HandleError({error})];
  if (onFailure) {
    actions.push(new CommonAction.ExecuteCallback({callback: () => onFailure(error)}));
  }
  return of(...actions, ...(additionalActions || []));
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
          configuration: convertRulesConfigurationFromDto(dto[id]),
        }) as Rule
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function convertRulesConfigurationFromDto(dto: RuleDto): RuleConfiguration {
  const type = ruleTypeMap[dto?.type];
  switch (type) {
    case RuleType.Cron:
      return convertCronRuleConfigurationDtoToModel(dto.configuration as CronRuleConfigurationDto);
    default:
      return dto.configuration as RuleConfiguration;
  }
}

function convertCronRuleConfigurationDtoToModel(dto: CronRuleConfigurationDto): CronRuleConfiguration {
  return {
    ...dto, // get blockly config
    startsOn: dto.startsOn && new Date(dto.startsOn),
    endsOn: dto.endsOn && new Date(dto.endsOn),
    hour: dto.hour?.toString(),
    interval: dto.interval,
    daysOfWeek: dto.daysOfWeek, // days of week - stored as binary number starting with Monday as the least significant bit
    occurrence: dto.occurrence,
    lastRun: dto.lastRun && new Date(dto.lastRun),
    executionsLeft: dto.executionsLeft,
    unit: chronoUnitMap[dto.unit],
    viewId: dto.viewId,
    language: languageCodeMap[dto.language],
  };
}

export function convertRulesToDto(model: Rule[]): Record<string, RuleDto> {
  if (!model) {
    return {};
  }

  return model.reduce((result, rule) => {
    result[rule.id || generateCorrelationId()] = convertRuleToDto(rule);
    return result;
  }, {});
}

export function convertRuleToDto(rule: Rule): RuleDto {
  return (
    rule && {
      name: rule.name,
      type: rule.type,
      timing: rule.timing,
      configuration: convertRulesConfigurationToDto(rule),
    }
  );
}

export function convertRulesConfigurationToDto(rule: Rule): Record<string, any> {
  switch (rule.type) {
    case RuleType.Cron:
      return convertCronRuleConfigurationModelToDto(rule.configuration);
    default:
      return rule.configuration;
  }
}

function convertCronRuleConfigurationModelToDto(model: CronRuleConfiguration): CronRuleConfigurationDto {
  return {
    ...model, // to convert blockly part
    startsOn: model.startsOn?.toISOString(),
    endsOn: model.endsOn?.toISOString(),
    hour: +model.hour,
    interval: model.interval,
    daysOfWeek: model.daysOfWeek,
    occurrence: model.occurrence,
    executionsLeft: model.executionsLeft,
    lastRun: null,
    unit: model.unit,
    viewId: model.viewId,
    language: model.language,
  };
}
