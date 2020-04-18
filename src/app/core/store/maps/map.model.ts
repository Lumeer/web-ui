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

import {AttributesResource, AttributesResourceType, DataResource} from '../../model/resource';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface MapModel {
  id: string;
  config: MapConfig;
}

export interface MapPosition {
  bearing?: number;
  center?: MapCoordinates;
  pitch?: number;
  zoom?: number;
}

export interface MapConfig {
  attributeIdsMap?: AttributeIdsMap;
  position?: MapPosition;
  positionSaved?: boolean;
}

export type AttributeIdsMap = Record<string, string[]>;

export const DEFAULT_MAP_CONFIG: MapConfig = {
  attributeIdsMap: {},
  positionSaved: false,
};

export interface MapMarkerProperties {
  resourceId: string;
  resourceType: AttributesResourceType;
  dataResourceId: string;
  attributeId: string;
  icon: string;
  color: string;
  displayValue: string;
  positionValue: string;
  attributeType?: MapAttributeType;
  coordinates?: MapCoordinates;
  editable?: boolean;
}

export interface MapMarkerData {
  resource: AttributesResource;
  dataResource: DataResource;
  attributeId: string;
  editable?: boolean;
}

export enum MapAttributeType {
  Address = 'Address',
  Coordinates = 'Coordinates',
}
