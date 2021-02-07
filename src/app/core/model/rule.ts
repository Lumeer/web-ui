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

import {QueryDto} from '../dto';
import {Language, LanguageCode} from '../../shared/top-panel/user-panel/user-menu/language';
import {Query} from '../store/navigation/query/query';

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
  blocklyError: string;
  blocklyResultTimestamp: number;
  blocklyDryRun: boolean;
  blocklyDryRunResult: string;
}

export interface ZapierRuleConfiguration {
  hookUrl: string;
  id: string;
}

export enum ChronoUnit {
  Hours = 'HOURS',
  Days = 'DAYS',
  Weeks = 'WEEKS',
  Months = 'MONTHS',
  Years = 'YEARS',
}

export const chronoUnitMap = {
  [ChronoUnit.Hours]: ChronoUnit.Hours,
  [ChronoUnit.Days]: ChronoUnit.Days,
  [ChronoUnit.Weeks]: ChronoUnit.Weeks,
  [ChronoUnit.Months]: ChronoUnit.Months,
  [ChronoUnit.Years]: ChronoUnit.Years,
};

export interface CronRuleConfiguration extends BlocklyRuleConfiguration {
  since?: Date;
  until?: Date;
  when: number;
  interval: number;
  dow: number; // days of week - stored as binary number starting with Monday as the least significant bit
  lastRun?: string;
  unit: ChronoUnit;
  executing?: string;
  query: Query;
  language: LanguageCode;
}

export interface WorkflowRuleConfiguration {}

export type Rule = AutoLinkRule | BlocklyRule | ZapierRule | CronRule;
export type RuleConfiguration =
  | AutoLinkRuleConfiguration
  | BlocklyRuleConfiguration
  | ZapierRuleConfiguration
  | CronRuleConfiguration;
