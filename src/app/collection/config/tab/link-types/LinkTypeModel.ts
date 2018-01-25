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

import {LinkType} from '../../../../core/dto/link-type';

export class LinkTypeModel {

  public initialized = true;
  public initializing = false;
  public expanded = false;
  public baseCollectionId: string;
  public data: LinkType;

  constructor(linkType?: LinkType, baseCollectionId?: string) {
    if (linkType) {
      this.createInitialized(linkType);
      return;
    }

    if (baseCollectionId) {
      this.createUninitialized(baseCollectionId);
      return;
    }

    throw new Error('You must provide a link type or a collection to the constructor');
  }

  private createInitialized(linkType: LinkType) {
    this.data = linkType;
    this.baseCollectionId = linkType.collectionIds[0];
  }

  private createUninitialized(baseCollectionId: string) {
    this.baseCollectionId = baseCollectionId;
    this.data = {
      name: '',
      attributes: [],
    };
    this.initialized = false;
  }

  public changeLinkedCollection(collectionId: string): void {
    this.data.collectionIds[1] = collectionId;
    this.data.attributes = [];
  }

}
