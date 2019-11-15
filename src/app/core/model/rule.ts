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

export enum RuleType {
  AutoLink = 'AUTO_LINK',
  Blockly = 'BLOCKLY',
  Zapier = 'ZAPIER',
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

export const RuleTypeMap = {
  [RuleType.AutoLink]: RuleType.AutoLink,
  [RuleType.Blockly]: RuleType.Blockly,
  [RuleType.Zapier]: RuleType.Zapier,
};

export const RuleTimingMap = {
  [RuleTiming.Create]: RuleTiming.Create,
  [RuleTiming.Update]: RuleTiming.Update,
  [RuleTiming.CreateUpdate]: RuleTiming.CreateUpdate,
  [RuleTiming.Delete]: RuleTiming.Delete,
  [RuleTiming.CreateDelete]: RuleTiming.CreateDelete,
  [RuleTiming.UpdateDelete]: RuleTiming.UpdateDelete,
  [RuleTiming.All]: RuleTiming.All,
};

interface BasicRule {
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

export type AutoLinkRuleConfiguration = {
  collection1: string;
  attribute1: string;
  collection2: string;
  attribute2: string;
  linkType: string;
};

export type BlocklyRuleConfiguration = {
  blocklyXml: string;
  blocklyJs: string;
  blocklyError: string;
  blocklyResultTimestamp: number;
  blocklyDryRun: boolean;
  blocklyDryRunResult: string;
};

export type ZapierRuleConfiguration = {
  hookUrl: string;
  id: string;
};

export type Rule = AutoLinkRule | BlocklyRule | ZapierRule;
export type RuleConfiguration = AutoLinkRuleConfiguration | BlocklyRuleConfiguration | ZapierRuleConfiguration;
