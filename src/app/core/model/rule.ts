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
import {LanguageCode} from './language';

export enum RuleType {
  AutoLink = 'AUTO_LINK',
  Blockly = 'BLOCKLY',
  Zapier = 'ZAPIER',
  Cron = 'CRON',
  Workflow = 'WORKFLOW',
}

export enum RuleTiming {
  Create = 'CREATE',
  Update = 'UPDATE',
  CreateUpdate = 'CREATE_UPDATE',
  Delete = 'DELETE',
  CreateDelete = 'CREATE_DELETE',
  UpdateDelete = 'UPDATE_DELETE',
  All = 'ALL',
}

export const ruleTypeMap = {
  [RuleType.AutoLink]: RuleType.AutoLink,
  [RuleType.Blockly]: RuleType.Blockly,
  [RuleType.Zapier]: RuleType.Zapier,
  [RuleType.Cron]: RuleType.Cron,
  [RuleType.Workflow]: RuleType.Workflow,
};

export const ruleTimingMap = {
  [RuleTiming.Create]: RuleTiming.Create,
  [RuleTiming.Update]: RuleTiming.Update,
  [RuleTiming.CreateUpdate]: RuleTiming.CreateUpdate,
  [RuleTiming.Delete]: RuleTiming.Delete,
  [RuleTiming.CreateDelete]: RuleTiming.CreateDelete,
  [RuleTiming.UpdateDelete]: RuleTiming.UpdateDelete,
  [RuleTiming.All]: RuleTiming.All,
};

interface BasicRule {
  id?: string;
  name: string;
  type: RuleType;
  timing: RuleTiming;
}

export interface AutoLinkRule extends BasicRule {
  type: RuleType.AutoLink;
  configuration: AutoLinkRuleConfiguration;
}

export interface BlocklyRule extends BasicRule {
  type: RuleType.Blockly;
  configuration: BlocklyRuleConfiguration;
}

export interface ZapierRule extends BasicRule {
  type: RuleType.Zapier;
  configuration: ZapierRuleConfiguration;
}

export interface CronRule extends BasicRule {
  type: RuleType.Cron;
  configuration: CronRuleConfiguration;
}

export interface WorkflowRule extends BasicRule {
  type: RuleType.Workflow;
  configuarion: WorkflowRuleConfiguration;
}

export interface AutoLinkRuleConfiguration {
  collection1: string;
  attribute1: string;
  collection2: string;
  attribute2: string;
  linkType: string;
}

export interface BlocklyRuleConfiguration {
  blocklyXml: string;
  blocklyJs: string;
  blocklyError?: string;
  blocklyResultTimestamp?: number;
  blocklyDryRun?: boolean;
  blocklyDryRunResult?: string;
  blocklyRecursive?: boolean;
}

export interface ZapierRuleConfiguration {
  hookUrl: string;
  id: string;
}

export enum ChronoUnit {
  Hours = 'Hours',
  Days = 'Days',
  Weeks = 'Weeks',
  Months = 'Months',
  Years = 'Years',
}

export const chronoUnitMap = {
  [ChronoUnit.Hours]: ChronoUnit.Hours,
  [ChronoUnit.Days]: ChronoUnit.Days,
  [ChronoUnit.Weeks]: ChronoUnit.Weeks,
  [ChronoUnit.Months]: ChronoUnit.Months,
  [ChronoUnit.Years]: ChronoUnit.Years,
};

export interface CronRuleConfiguration extends BlocklyRuleConfiguration {
  unit: ChronoUnit;
  interval: number;
  daysOfWeek: number; // stored as binary number starting with Monday as the least significant bit
  hour: string;
  occurrence?: number;
  startsOn?: Date;
  endsOn?: Date;
  executionsLeft?: number;
  lastRun?: Date;
  viewId?: string;
  language?: LanguageCode;
}

export interface WorkflowRuleConfiguration {}

export type Rule = AutoLinkRule | BlocklyRule | ZapierRule | CronRule;
export type RuleConfiguration =
  | AutoLinkRuleConfiguration
  | BlocklyRuleConfiguration
  | ZapierRuleConfiguration
  | CronRuleConfiguration;

export function maxIntervalByChronoUnit(unit: ChronoUnit): number {
  switch (unit) {
    case ChronoUnit.Days:
      return 365;
    case ChronoUnit.Weeks:
      return 160;
    case ChronoUnit.Months:
      return 36;
  }
}

export function ruleTimingHasCreate(timing: RuleTiming): boolean {
  return [RuleTiming.All, RuleTiming.Create, RuleTiming.CreateUpdate, RuleTiming.CreateDelete].indexOf(timing) >= 0;
}

export function ruleTimingHasUpdate(timing: RuleTiming): boolean {
  return [RuleTiming.All, RuleTiming.Update, RuleTiming.CreateUpdate, RuleTiming.UpdateDelete].indexOf(timing) >= 0;
}

export function ruleTimingHasDelete(timing: RuleTiming): boolean {
  return [RuleTiming.All, RuleTiming.Delete, RuleTiming.CreateDelete, RuleTiming.UpdateDelete].indexOf(timing) >= 0;
}

export function createRuleTiming(hasCreate: boolean, hasUpdate: boolean, hasDelete: boolean): RuleTiming {
  if (hasCreate) {
    if (hasUpdate) {
      if (hasDelete) {
        return RuleTiming.All;
      }
      return RuleTiming.CreateUpdate;
    }
    if (hasDelete) {
      return RuleTiming.CreateDelete;
    }
    return RuleTiming.Create;
  } else {
    if (hasUpdate) {
      if (hasDelete) {
        return RuleTiming.UpdateDelete;
      }
      return RuleTiming.Update;
    }
    if (hasDelete) {
      return RuleTiming.Delete;
    }
  }
  return null;
}
