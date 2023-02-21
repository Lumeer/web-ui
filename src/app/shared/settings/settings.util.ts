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
import {LinkType} from '../../core/store/link-types/link.type';
import {AttributesResource, AttributesResourceType} from '../../core/model/resource';
import {deepArrayEquals, moveItemInArray, uniqueValues} from '../utils/array.utils';
import {Query} from '../../core/store/navigation/query/query';
import {getAllCollectionIdsFromQuery, getAllLinkTypeIdsFromQuery} from '../../core/store/navigation/query/query.util';
import {objectValues} from '../utils/common.utils';
import {
  AttributesSettings,
  ResourceAttributeSettings,
  ResourcesPermissions,
  ViewSettings,
} from '../../core/store/view-settings/view-settings';
import {permissionsAreEmpty} from '../utils/permission.utils';
import {Permissions} from '../../core/store/permissions/permissions';

const composedIdSeparator = ':';

export function parseViewSettingsLinkTypeCollectionIds(composedId: string): {collectionId: string; linkTypeId: string} {
  const ids = (composedId || '').split(composedIdSeparator, 2);
  return {collectionId: ids[1], linkTypeId: ids[0]};
}

export function composeViewSettingsLinkTypeCollectionId(collectionId: string, linkTypeId: string): string {
  return `${linkTypeId}${composedIdSeparator}${collectionId}`;
}

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

export function viewAttributeSettingsSortDefined(settings: ViewSettings): boolean {
  const attributesSettings = [
    ...objectValues(settings?.attributes?.collections || {}),
    ...objectValues(settings?.attributes?.linkTypes || {}),
  ];
  return attributesSettings.some(attributeSettings => attributeSettings.some(setting => setting.sort));
}

export function viewAttributesSettingsIsEmpty(settings: AttributesSettings): boolean {
  return (
    Object.keys(settings?.collections || {}).length === 0 &&
    Object.keys(settings?.linkTypes || {}).length === 0 &&
    Object.keys(settings?.linkTypesCollections || {}).length === 0
  );
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
    ) ||
    viewResourceAttributesSettingsChanged(previousSettings?.linkTypes, currentSettings?.linkTypes, linkTypesMap) ||
    viewResourceAttributesSettingsChanged(
      previousSettings?.linkTypesCollections,
      currentSettings?.linkTypesCollections,
      collectionsMap,
      true
    )
  );
}

export function viewAttributeSettingsSortChanged(
  previousSettings: AttributesSettings,
  currentSettings: AttributesSettings
): boolean {
  return (
    viewResourceAttributesSortSettingsChanged(previousSettings?.collections, currentSettings?.collections) ||
    viewResourceAttributesSortSettingsChanged(previousSettings?.linkTypes, currentSettings?.linkTypes) ||
    viewResourceAttributesSortSettingsChanged(
      previousSettings?.linkTypesCollections,
      currentSettings?.linkTypesCollections
    )
  );
}

function viewResourceAttributesSettingsChanged(
  previousSettings: Record<string, ResourceAttributeSettings[]>,
  currentSettings: Record<string, ResourceAttributeSettings[]>,
  resourcesMap: Record<string, AttributesResource>,
  composed?: boolean
): boolean {
  const keys = uniqueValues([...Object.keys(currentSettings || {}), ...Object.keys(previousSettings || {})]);
  return keys.some(key => {
    const resourceId = composed ? parseViewSettingsLinkTypeCollectionIds(key).collectionId : key;
    const attributes = resourcesMap[resourceId]?.attributes || [];
    const previousOrder = createAttributesSettingsOrder(attributes, previousSettings?.[key]);
    const currentOrder = createAttributesSettingsOrder(attributes, currentSettings?.[key]);

    return !deepArrayEquals(previousOrder, currentOrder);
  });
}

function viewResourceAttributesSortSettingsChanged(
  previousSettings: Record<string, ResourceAttributeSettings[]>,
  currentSettings: Record<string, ResourceAttributeSettings[]>
): boolean {
  return Object.keys(currentSettings || {}).some(key => {
    const previousAttributeSettings = previousSettings?.[key]?.map(val => val.sort);
    const currentAttributeSettings = currentSettings?.[key]?.map(val => val.sort);

    return !deepArrayEquals(previousAttributeSettings, currentAttributeSettings);
  });
}

export function createSaveAttributesSettings(
  settings: AttributesSettings,
  query: Query,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): AttributesSettings {
  if (!settings) {
    return settings;
  }

  const collectionIds = getAllCollectionIdsFromQuery(query, objectValues(linkTypesMap));
  const linkTypeIds = getAllLinkTypeIdsFromQuery(query);

  return {
    collections: createSaveResourceAttributesSettings(
      settings.collections,
      filterResourcesMap(collectionIds, collectionsMap)
    ),
    linkTypes: createSaveResourceAttributesSettings(settings.linkTypes, filterResourcesMap(linkTypeIds, linkTypesMap)),
    linkTypesCollections: createSaveResourceAttributesSettings(
      settings.linkTypesCollections,
      filterResourcesMap(collectionIds, collectionsMap),
      true
    ),
  };
}

export function createSavePermissionsSettings(settings: ResourcesPermissions): ResourcesPermissions {
  return {
    collections: filterEmptyPermissionsMap(settings?.collections),
    linkTypes: filterEmptyPermissionsMap(settings?.linkTypes),
  };
}

function filterEmptyPermissionsMap(permissionsMap: Record<string, Permissions>): Record<string, Permissions> {
  return Object.keys(permissionsMap || {}).reduce((map, resourceId) => {
    if (!permissionsAreEmpty(permissionsMap[resourceId])) {
      map[resourceId] = permissionsMap[resourceId];
    }
    return map;
  }, {});
}

function filterResourcesMap(
  allowedIds: string[],
  resourcesMap: Record<string, AttributesResource>
): Record<string, AttributesResource> {
  return Object.entries(resourcesMap).reduce((map, [resourceId, resource]) => {
    if (allowedIds.includes(resourceId)) {
      map[resourceId] = resource;
    }
    return map;
  }, {});
}

function createSaveResourceAttributesSettings(
  settings: Record<string, ResourceAttributeSettings[]>,
  resourcesMap: Record<string, AttributesResource>,
  composite?: boolean
): Record<string, ResourceAttributeSettings[]> {
  if (Object.keys(settings || {}).length === 0) {
    return settings;
  }

  return Object.keys(settings || {}).reduce((map, key) => {
    const resourceId = composite ? parseViewSettingsLinkTypeCollectionIds(key).collectionId : key;
    const resource = resourcesMap[resourceId];
    if (resource) {
      return {...map, [resourceId]: createAttributesSettingsOrder(resource.attributes, settings[resourceId])};
    }
    return map;
  }, {});
}

export function createAndModifyViewSettings(
  settings: ViewSettings,
  resource: AttributesResource,
  type: AttributesResourceType,
  modify: (array: ResourceAttributeSettings[]) => ResourceAttributeSettings[]
): ViewSettings {
  return {
    ...settings,
    attributes: createAndModifyAttributesSettings(settings?.attributes, resource, type, modify),
  };
}

export function createAndModifyAttributesSettings(
  attributesSettings: AttributesSettings,
  resource: AttributesResource,
  type: AttributesResourceType,
  modify: (array: ResourceAttributeSettings[]) => ResourceAttributeSettings[],
  composedId?: string
): AttributesSettings {
  const property =
    type === AttributesResourceType.LinkType ? 'linkTypes' : composedId ? 'linkTypesCollections' : 'collections';
  const resourceId = composedId ? composeViewSettingsLinkTypeCollectionId(resource.id, composedId) : resource.id;
  const nonNulLAttributesSettings = {...attributesSettings};
  const resourceSettings = {...nonNulLAttributesSettings[property]};
  const orderedSettingsAttributes = createAttributesSettingsOrder(
    resource.attributes,
    resourceSettings?.[resourceId] || []
  );
  resourceSettings[resourceId] = modify(orderedSettingsAttributes);
  nonNulLAttributesSettings[property] = resourceSettings;
  return nonNulLAttributesSettings;
}

export function moveAttributeInSettings(
  state: ViewSettings,
  from: number,
  to: number,
  collection: Collection,
  linkType?: LinkType
): ViewSettings {
  const resourceType = linkType ? AttributesResourceType.LinkType : AttributesResourceType.Collection;
  return createAndModifyViewSettings(state, linkType || collection, resourceType, attributesSettings =>
    moveItemInArray(attributesSettings, from, to)
  );
}

export function addAttributeToSettings(
  state: ViewSettings,
  attributeId: string,
  position: number,
  collection: Collection,
  linkType?: LinkType
): ViewSettings {
  const resourceType = linkType ? AttributesResourceType.LinkType : AttributesResourceType.Collection;
  return createAndModifyViewSettings(state, linkType || collection, resourceType, attributesSettings => {
    attributesSettings.splice(position, 0, {attributeId});
    return attributesSettings;
  });
}

export function setAttributeToAttributeSettings(
  attributeId: string,
  settingAttributes: ResourceAttributeSettings[],
  settings: Partial<ResourceAttributeSettings>
): ResourceAttributeSettings[] {
  const attributeIndex = (settingAttributes || []).findIndex(setting => setting.attributeId === attributeId);
  if (attributeIndex !== -1) {
    settingAttributes[attributeIndex] = {...settingAttributes[attributeIndex], ...settings};
  }
  return settingAttributes;
}

export function resourceAttributeSettings(
  viewSettings: ViewSettings,
  attributeId: string,
  resourceId: string,
  resourceType: AttributesResourceType
): ResourceAttributeSettings {
  let settings: ResourceAttributeSettings[];
  if (resourceType === AttributesResourceType.LinkType) {
    settings = viewSettings?.attributes?.linkTypes?.[resourceId];
  } else {
    settings = viewSettings?.attributes?.collections?.[resourceId];
  }
  return settings?.find(setting => setting.attributeId === attributeId);
}
