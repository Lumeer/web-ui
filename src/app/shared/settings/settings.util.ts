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

import {Attribute, Collection} from '../../core/store/collections/collection';
import {AttributesSettings, ResourceAttributeSettings} from '../../core/store/views/view';
import {LinkType} from '../../core/store/link-types/link.type';
import {AttributesResource} from '../../core/model/resource';
import {deepArrayEquals} from '../utils/array.utils';

export function createAttributesSettingsOrder(
  attributes: Attribute[],
  settings: ResourceAttributeSettings[]
): ResourceAttributeSettings[] {
  const attributesCopy = [...(attributes || [])];
  const modifiedSettings = [];
  settings?.forEach(setting => {
    const index = attributesCopy.findIndex(attribute => attribute.id === setting.attributeId);
    if (index >= 0) {
      modifiedSettings.push(setting);
      attributesCopy.splice(index, 1);
    }
  });

  attributesCopy.forEach(attribute => modifiedSettings.push({attributeId: attribute.id}));

  return modifiedSettings;
}

export function viewAttributeSettingsChanged(
  previousSettings: AttributesSettings,
  currentSettings: AttributesSettings,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  return (
    viewResourceAttributesSettingsChanged(
      previousSettings?.collections,
      currentSettings?.collections,
      collectionsMap
    ) || viewResourceAttributesSettingsChanged(previousSettings?.linkTypes, currentSettings?.linkTypes, linkTypesMap)
  );
}

function viewResourceAttributesSettingsChanged(
  previousSettings: Record<string, ResourceAttributeSettings[]>,
  currentSettings: Record<string, ResourceAttributeSettings[]>,
  resourcesMap: Record<string, AttributesResource>
): boolean {
  if (Object.keys(previousSettings || {}).length !== Object.keys(currentSettings || {}).length) {
    return true;
  }

  return Object.keys(previousSettings || {}).some(resourceId => {
    const attributes = resourcesMap[resourceId]?.attributes || [];
    const settings = createAttributesSettingsOrder(attributes, previousSettings[resourceId]);
    return (
      !currentSettings[resourceId] ||
      !deepArrayEquals(settings, createAttributesSettingsOrder(attributes, currentSettings[resourceId]))
    );
  });
}

export function createSaveAttributesSettings(
  settings: AttributesSettings,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): AttributesSettings {
  if (!settings) {
    return settings;
  }
  return {
    collections: createSaveResourceAttributesSettings(settings.collections, collectionsMap),
    linkTypes: createSaveResourceAttributesSettings(settings.linkTypes, linkTypesMap),
  };
}

function createSaveResourceAttributesSettings(
  settings: Record<string, ResourceAttributeSettings[]>,
  resourcesMap: Record<string, AttributesResource>
): Record<string, ResourceAttributeSettings[]> {
  if (Object.keys(settings || {}).length === 0) {
    return settings;
  }

  return Object.keys(settings || {}).reduce((map, resourceId) => {
    const attributes = resourcesMap[resourceId]?.attributes || [];
    return {...map, [resourceId]: createAttributesSettingsOrder(attributes, settings[resourceId])};
  }, {});
}
