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

import {Attribute, AttributeFunction} from '../../core/store/collections/collection';
import {BlocklyRule, Rule, RuleType} from '../../core/model/rule';
import {objectsByIdMap, objectValues} from './common.utils';
import {
  ActionConstraintConfig,
  AttributeFilter,
  AttributeLock,
  AttributeLockFiltersStats,
  collectAttributeLockFilters,
  computeAttributeLockStats,
  dataValuesSatisfyEquation,
  ConstraintData,
  ConstraintType,
  DataValue,
  SelectConstraint,
  SelectConstraintConfig,
  UserConstraint,
  UserConstraintConfig,
  ViewConstraint,
  ViewConstraintConfig,
} from '@lumeer/data-filters';
import {createAttributesSettingsOrder} from '../settings/settings.util';
import {AttributesResource, DataResource} from '../../core/model/resource';
import {ResourceAttributeSettings} from '../../core/store/views/view';
import {fontStyleClass} from '../../core/model/font-style';

export const FORBIDDEN_ATTRIBUTE_NAME_CHARACTERS = ['.'];
export const FORBIDDEN_ATTRIBUTE_NAME_CHARACTERS_REGEX = /\./g;

export function attributeHasAnyFunction(attribute: Attribute, rules?: Rule[]): boolean {
  return attributeHasFunction(attribute) || attributeHasRuleFunction(attribute, rules);
}

export function attributeHasFunction(attribute: Attribute): boolean {
  return attribute?.constraint?.allowEditFunction && attribute?.function?.js?.length > 0;
}

export function attributeHasEditableFunction(attribute: Attribute): boolean {
  return attributeHasFunction(attribute) || attribute?.constraint?.allowEditFunction;
}

export function attributeHasRuleFunction(attribute: Attribute, rules?: Rule[]): boolean {
  return !!attributeRuleFunction(attribute, rules);
}

export function attributeRuleFunction(attribute: Attribute, rules?: Rule[]): AttributeFunction {
  const rule = <BlocklyRule>findAttributeRule(attribute, rules, RuleType.Blockly);
  if (rule?.configuration) {
    return {
      js: rule.configuration.blocklyJs,
      xml: rule.configuration.blocklyXml,
      errorReport: rule.configuration.blocklyError,
      timestamp: rule.configuration.blocklyResultTimestamp,
      dryRun: rule.configuration.blocklyDryRun,
      dryRunResult: rule.configuration.blocklyDryRunResult,
      recursive: rule.configuration.blocklyRecursive,
    };
  }
  return null;
}

export function findAttributeRule(attribute: Attribute, rules: Rule[], type: RuleType = RuleType.Blockly): Rule {
  if (attribute?.constraint?.type === ConstraintType.Action) {
    const config = <ActionConstraintConfig>attribute.constraint.config;
    return (rules || []).find(r => r.id === config?.rule && r.type === type);
  }
  return null;
}

export function findAttributeById(attributes: Attribute[], attributeId: string): Attribute {
  return (attributes || []).find(attribute => attribute.id === attributeId);
}

export function findAttributeByName(attributes: Attribute[], name: string): Attribute {
  return (attributes || []).find(attribute => attribute.name === name);
}

export function maxAttributeDepth(attributes: Attribute[]): number {
  return Math.max(...(attributes || []).map(attribute => getAttributeDepth(attribute)));
}

export function filterAttributesByDepth(attributes: Attribute[], depth: number): Attribute[] {
  return (attributes || []).filter(attribute => getAttributeDepth(attribute) === depth);
}

export function filterDirectAttributeChildren(attributes: Attribute[], parent: Attribute): Attribute[] {
  if (!parent) {
    return (attributes || []).filter(attribute => getAttributeDepth(attribute) === 1);
  }

  return (attributes || []).filter(attribute => isDirectAttributeChild(parent, attribute));
}

export function isDirectAttributeChild(parent: Attribute, potentialChild: Attribute): boolean {
  return (
    potentialChild.name.startsWith(parent.name) && getAttributeDepth(potentialChild) === getAttributeDepth(parent) + 1
  );
}

export function hasAttributeChildren(attributes: Attribute[], parent: Attribute): boolean {
  return (attributes || []).some(attribute => isDirectAttributeChild(parent, attribute));
}

export function getAttributeDepth(attribute: Attribute): number {
  return attribute?.name.split('.').length;
}

export function extractAttributeLastName(name: string): string {
  return name && splitAttributeName(name).lastName;
}

export function extractAttributeParentName(name: string): string {
  return name && splitAttributeName(name).parentName;
}

export function splitAttributeName(name: string): {parentName: string; lastName: string} {
  const parts = name.split('.');
  if (parts.length === 1) {
    return {parentName: null, lastName: name};
  }

  return {
    parentName: parts.slice(0, parts.length - 1).join('.'),
    lastName: parts[parts.length - 1],
  };
}

export function generateAttributeNameFromAttributes(attributes: Attribute[]): string {
  const names = (attributes || []).map(attribute => attribute.name);
  return generateAttributeName(names);
}

export function generateAttributeName(existingNames: string[], parentName?: string): string {
  const prefix = parentName ? `${parentName}.` : '';

  let lastName = 'A';
  while (existingNames.includes(prefix + lastName)) {
    lastName = increaseChar(lastName);
  }

  return prefix + lastName;
}

export function increaseChar(name: string): string {
  const lastIndex = name.length - 1;
  if (lastIndex < 0) {
    return 'A';
  }

  if (name[lastIndex] !== 'Z') {
    const nextChar = String.fromCharCode(name.charCodeAt(lastIndex) + 1);
    return name.substring(0, lastIndex).concat(nextChar);
  }

  return increaseChar(name.substring(0, lastIndex)) + 'A';
}

export function updateAttributes(attributes: Attribute[], newAttribute: Attribute): Attribute[] {
  const index = (attributes || []).findIndex(attr => attr.id === newAttribute.id);

  if (index < 0) {
    return (attributes || []).concat(newAttribute);
  }

  const oldAttribute = attributes[index];
  const updatedAttributes = [...attributes];
  updatedAttributes.splice(index, 1, newAttribute);

  if (oldAttribute && oldAttribute.name !== newAttribute.name) {
    return renameChildAttributes(updatedAttributes, oldAttribute.name, newAttribute.name);
  }

  return updatedAttributes;
}

export function renameChildAttributes(
  attributes: Attribute[],
  oldParentName: string,
  newParentName: string
): Attribute[] {
  const prefix = oldParentName + '.';
  return attributes.map(attribute => {
    if (attribute.name.startsWith(prefix)) {
      const [, suffix] = attribute.name.split(oldParentName, 2);
      return {...attribute, name: newParentName + suffix};
    }
    return attribute;
  });
}

export function filterOutAttributeAndChildren(attributes: Attribute[], oldAttribute: Attribute): Attribute[] {
  return oldAttribute
    ? attributes.filter(
        attribute => attribute.id !== oldAttribute.id && !attribute.name.startsWith(`${oldAttribute.name}.`)
      )
    : attributes;
}

export function isAttributeConstraintType(attribute: Attribute, type: ConstraintType): boolean {
  return attribute?.constraint?.type === type;
}

export function filterOutInvalidAttributeNameCharacters(lastName: string): string {
  const regex = new RegExp(`[${FORBIDDEN_ATTRIBUTE_NAME_CHARACTERS.map(character => `\\${character}`)}]`, 'g');
  return (lastName || '').replace(regex, '');
}

export function filterUnusedAttributes(attributes: Attribute[], data: Record<string, any>): Attribute[] {
  const usedAttributesIds = Object.keys(data || {});
  return (attributes || []).filter(attribute => !usedAttributesIds.includes(attribute.id));
}

export function containsAttributeWithRule(attributes: Attribute[], rule: Rule): boolean {
  return attributes?.some(attribute => {
    if (attribute.constraint?.type === ConstraintType.Action) {
      const config = <ActionConstraintConfig>attribute.constraint.config;
      return config?.rule === rule.id;
    }
    return false;
  });
}

export function attributesWithRule(attributes: Attribute[], rule: Rule): string[] {
  return attributes
    ?.filter(attribute => {
      if (attribute.constraint?.type === ConstraintType.Action) {
        const config = <ActionConstraintConfig>attribute.constraint.config;
        return config?.rule === rule.id;
      }
      return false;
    })
    .map(attribute => attribute.name);
}

export function filterAttributesByFilters(attributes: Attribute[], filters: AttributeFilter[]): Attribute[] {
  const attributesMap = objectsByIdMap(attributes);
  return uniqueAttributes(
    (filters || []).reduce((attrs, filter) => {
      const attribute = attributesMap[filter.attributeId];
      if (attribute) {
        attrs.push(attribute);
      }
      if (attribute?.constraint?.type === ConstraintType.Action) {
        attrs.push(
          ...collectAttributeLockFilters(attribute.lock)
            .filter(configFilter => !!attributesMap[configFilter.attributeId])
            .map(configFilter => attributesMap[configFilter.attributeId])
        );
      }
      return attrs;
    }, [])
  );
}

export function uniqueAttributes(attributes: Attribute[]): Attribute[] {
  return objectValues(objectsByIdMap(attributes));
}

export function modifyAttributeForQueryFilter(attribute: Attribute): Attribute {
  if (!attribute?.constraint) {
    return attribute;
  }

  const constraint = attribute.constraint;
  switch (constraint.type) {
    case ConstraintType.View:
      const viewConfig = <ViewConstraintConfig>{...constraint.config, multi: true};
      const viewConstraint = new ViewConstraint(viewConfig);
      return {...attribute, constraint: viewConstraint};
    case ConstraintType.Select:
      const selectConfig = <SelectConstraintConfig>{...constraint.config, multi: true};
      const selectConstraint = new SelectConstraint(selectConfig);
      return {...attribute, constraint: selectConstraint};
    case ConstraintType.User:
      const userConfig = <UserConstraintConfig>{...constraint.config, multi: true};
      const userConstraint = new UserConstraint(userConfig);
      return {...attribute, constraint: userConstraint};
    default:
      return attribute;
  }
}

export function filterVisibleAttributesBySettings(
  resource: AttributesResource,
  settingsMap: Record<string, ResourceAttributeSettings[]>,
  key: string = resource?.id
): Attribute[] {
  const settings = settingsMap?.[key];
  return filterVisibleAttributesByResourceSettings(resource, settings);
}

export function filterVisibleAttributesByResourceSettings(
  resource: AttributesResource,
  resourceSettings: ResourceAttributeSettings[]
): Attribute[] {
  const attributesMap = objectsByIdMap(resource?.attributes);
  return createAttributesSettingsOrder(resource?.attributes, resourceSettings)
    .filter(setting => !setting.hidden)
    .map(setting => attributesMap[setting.attributeId])
    .filter(attribute => !!attribute);
}

export function isAttributeVisibleInResourceSettings(
  attributeId: string,
  resourceSettings: ResourceAttributeSettings[]
): boolean {
  return !(resourceSettings || []).some(setting => setting.attributeId === attributeId && setting.hidden);
}

export function mergeAttributeOverride(attribute: Attribute, override: Partial<Attribute>): Attribute {
  if (!attribute || !override) {
    return attribute;
  }

  return {...attribute, mandatory: attribute.mandatory || override?.mandatory};
}

export function isUsedConstraintAttribute(attribute: Attribute, type: ConstraintType): boolean {
  return attribute?.usageCount > 0 && attribute.constraint?.type === type;
}

export function isAttributeEditable(
  resource: AttributesResource,
  dataResource: DataResource,
  attribute: Attribute,
  constraintData: ConstraintData
): boolean {
  const stats = computeAttributeLockStats(dataResource, resource, attribute?.lock, constraintData);
  return isAttributeLockEnabledByLockStats(attribute?.lock, stats);
}

export function isAttributeLockEnabledByLockStats(lock: AttributeLock, stats: AttributeLockFiltersStats): boolean {
  if (lock?.locked) {
    return !!stats?.satisfy;
  }
  return !stats?.satisfy;
}

const NO_HINTS_CONSTRAINT_TYPES = [
  ConstraintType.Action,
  ConstraintType.Color,
  ConstraintType.Boolean,
  ConstraintType.DateTime,
  ConstraintType.Select,
  ConstraintType.View,
  ConstraintType.User,
  ConstraintType.Files,
  ConstraintType.Link,
];

export function canShowAttributeHints(type: ConstraintType): boolean {
  return !NO_HINTS_CONSTRAINT_TYPES.includes(type);
}

export function computeAttributeFormatting(
  attribute: Attribute,
  dataValues: Record<string, DataValue>,
  attributesMap: Record<string, Attribute>,
  constraintData?: ConstraintData
): {color?: string; background?: string; classes?: string} {
  const groups = attribute?.formatting?.groups || [];
  for (const group of groups) {
    if (dataValuesSatisfyEquation(dataValues, attributesMap, group.equation, constraintData)) {
      const classes = group.styles?.map(style => fontStyleClass(style)).filter(c => !!c) || [];
      return {color: group.color, background: group.background, classes: classes.join(' ')};
    }
  }

  return {};
}
