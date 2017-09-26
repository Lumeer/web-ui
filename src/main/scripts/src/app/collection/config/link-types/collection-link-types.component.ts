/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {NotificationsService} from 'angular2-notifications/dist';

import {Collection, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../../core/dto/collection';
import {CollectionTabComponent} from '../collection-tab.component';
import {LinkTypeService} from '../../../core/rest/link-type.service';
import {LinkType} from '../../../core/dto/link-type';
import {CollectionService} from '../../../core/rest/collection.service';
import {WorkspaceService} from '../../../core/workspace.service';

@Component({
  selector: 'collection-link-types',
  templateUrl: './collection-link-types.component.html',
  styleUrls: ['./collection-link-types.component.scss']
})
export class CollectionLinkTypesComponent extends CollectionTabComponent implements OnInit {

  public linkTypes: LinkType[] = [];

  public expanded: boolean[] = [];

  public collections: { [collectionCode: string]: Collection } = {};

  constructor(private linkTypeService: LinkTypeService,
              collectionService: CollectionService,
              route: ActivatedRoute,
              notificationService: NotificationsService,
              workspaceService: WorkspaceService) {
    super(collectionService, route, notificationService, workspaceService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.fetchData();
  }

  private async fetchData(): Promise<void> {
    const linkTypes = await this.fetchCurrentCollectionLinkTypes();

    const collectionCodes = linkTypes.map(linkType => linkType.toCollection);
    await this.fetchAllCollections(collectionCodes);
  }

  private async fetchCurrentCollectionLinkTypes(): Promise<LinkType[]> {
    this.linkTypes = await this.getLinkTypes(this.collection.code);
    return this.linkTypes;
  }

  private async getLinkTypes(collectionCode: string): Promise<LinkType[]> {
    return this.linkTypeService.getLinkTypes(collectionCode)
      .take(1)
      .toPromise()
      .catch(error => {
        this.notificationService.error('Error', 'Failed fetching Link Types');
        return [];
      });
  }

  private fetchAllCollections(collectionCodes: string[]): void {
    collectionCodes.forEach(collectionCode => this.fetchCollection(collectionCode));
  }

  private async fetchCollection(collectionCode: string): Promise<Collection> {
    if (!this.collections[collectionCode]) {
      const emptyCollection: Collection = {
        attributes: [],
        name: '',
        color: COLLECTION_NO_COLOR,
        icon: COLLECTION_NO_ICON
      };

      this.collections[collectionCode] = emptyCollection;
      this.collections[collectionCode] = await super.getCollection(collectionCode);
    }

    return this.collections[collectionCode];
  }

  public updateLinkType(linkType: LinkType, index): void {
    this.linkTypeService.updateLinkType(this.collection.code, linkType)
      .retry(3)
      .subscribe(
        linkType => this.linkTypes[index] = linkType,
        error => this.notificationService.error('Error', 'Failed updating link type')
      );
  }

  public listHeight(linkType: LinkType): string {
    const linkTypeheaderHeight = 40;
    const tableRowHeight = 52;
    return `${linkTypeheaderHeight + (this.collections[linkType.toCollection].attributes.length + 2) * tableRowHeight}px`;
  }

  public formatNumber(numberToFormat: number): string {
    const spaceBetweenEveryThreeDigits = /(?=(\d{3})+(?!\d))/g;
    const optionalCommaAtTheStart = /^,/;

    return String(numberToFormat)
      .replace(spaceBetweenEveryThreeDigits, ',')
      .replace(optionalCommaAtTheStart, '');
  }

}
