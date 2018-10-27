/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

export interface MapQuestCopyright {
  text: string;
  imageUrl: string;
  imageAltText: string;
}

export interface MapQuestInfo {
  statuscode: number;
  copyright: MapQuestCopyright;
  messages: any[];
}

export interface MapQuestOptions {
  maxResults: number;
  thumbMaps: boolean;
  ignoreLatLngInput: boolean;
}

export interface MapQuestProvidedLocation {
  location: string;
}

export interface MapQuestLatLng {
  lat: number;
  lng: number;
}

export interface Location {
  street: string;
  adminArea6: string;
  adminArea6Type: string;
  adminArea5: string;
  adminArea5Type: string;
  adminArea4: string;
  adminArea4Type: string;
  adminArea3: string;
  adminArea3Type: string;
  adminArea1: string;
  adminArea1Type: string;
  postalCode: string;
  geocodeQualityCode: string;
  geocodeQuality: string;
  dragPoint: boolean;
  sideOfStreet: string;
  linkId: string;
  unknownInput: string;
  type: string;
  latLng: MapQuestLatLng;
  displayLatLng: MapQuestLatLng;
}

export interface MapQuestResult {
  providedLocation: MapQuestProvidedLocation;
  locations: Location[];
}

export interface MapQuestResponse {
  info: MapQuestInfo;
  options: MapQuestOptions;
  results: MapQuestResult[];
}
