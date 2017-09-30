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
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';

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

  private initialName: { [collectionCode: string]: string } = {};

  public collections: { [collectionCode: string]: Collection } = {};

  constructor(private linkTypeService: LinkTypeService,
              private sanitizer: DomSanitizer,
              collectionService: CollectionService,
              route: ActivatedRoute,
              notificationService: NotificationsService,
              workspaceService: WorkspaceService) {
    super(collectionService, route, notificationService, workspaceService);
  }

  public ngOnInit(): void {
    this.refreshOnCollectionChange();
  }

  private refreshOnCollectionChange(): void {
    this.route.url.forEach(params => {
      this.fetchData();
    });
  }

  private async fetchData(): Promise<void> {
    await super.getCurrentCollection();
    const linkTypes = await this.fetchCurrentCollectionLinkTypes();

    const collectionCodes = linkTypes.map(linkType => linkType.toCollection);
    this.fetchAllCollections(collectionCodes);
  }

  private async fetchCurrentCollectionLinkTypes(): Promise<LinkType[]> {
    this.linkTypes = await this.getLinkTypes(this.collection.code);
    return this.linkTypes;
  }

  private async getLinkTypes(collectionCode: string): Promise<LinkType[]> {
    return this.linkTypeService.getLinkTypes(collectionCode)
      .retry(3)
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
      this.initialName[collectionCode] = this.collections[collectionCode].name;
    }

    return this.collections[collectionCode];
  }

  public newLinkType(): void {
    const emptyLinkType: LinkType = {
      fromCollection: this.collection.code,
      toCollection: '',
      name: '',
      attributes: [],
      instanceCount: 0
    };

    this.linkTypeService.createLinkType(emptyLinkType)
      .retry(3)
      .subscribe(
        linkType => this.linkTypes.push(linkType),
        error => this.notificationService.error('Error', 'Failed creating link type')
      );
  }

  public updateLinkType(linkType: LinkType, index: number): void {
    this.linkTypeService.updateLinkType(this.collection.code, this.initialName[linkType.toCollection], linkType)
      .retry(3)
      .subscribe(
        linkType => {
          this.fetchCollection(linkType.toCollection);
          this.linkTypes[index] = linkType;
          this.initialName[linkType.toCollection] = linkType.name;
        },
        error => this.notificationService.error('Error', 'Failed updating link type')
      );
  }

  public deleteLinkType(linkType: LinkType, idx: number): void {
    this.linkTypeService.removeLinkType(linkType)
      .retry(3)
      .subscribe(
        () => this.linkTypes.splice(idx, 1),
        error => this.notificationService.error('Error', 'Failed removing link type')
      );
  }

  public searchLinkTypesQueryParams(linkType: LinkType): object {
    return {
      query: JSON.stringify({linkNames: [linkType.name]})
    };
  }

  public hexToRgb(hexColor: string, darken: number): string {
    const hexToNumber = (start: number) => parseInt(hexColor.substr(start, 2), 16);
    const subtractAmount = (num: number) => Math.max(0, Math.min(255, num - darken));

    const colors = [hexToNumber(1), hexToNumber(3), hexToNumber(5)]
      .map(subtractAmount)
      .join(',');

    return `rgb(${colors})`;
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

  public gradient(color1: string, color2: string): SafeStyle {
    const startingColor = this.hexToRgb(color1, 0);
    const middleStartingColor = this.hexToRgb(color1, -10);
    const middleEndingColor = this.hexToRgb(color1, 10);
    const endingColor = this.hexToRgb(color2, 0);

    return this.sanitizer.bypassSecurityTrustStyle(
      `linear-gradient(135deg,${startingColor} 0%,${middleStartingColor} 50%,
      ${middleEndingColor} 51%,${endingColor} 100%)`
    );
  }

}
