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

import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {animate, style, transition, trigger} from '@angular/animations';

import {NotificationsService} from 'angular2-notifications/dist';

import {
  Collection,
  COLLECTION_NO_ICON,
  COLLECTION_NO_CODE,
  COLLECTION_NO_COLOR
} from '../../../core/dto/collection';
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

  @ViewChildren('name')
  public linkTypeNameInput: QueryList<ElementRef>;

  public linkTypes: LinkType[] = [];

  public expanded: boolean[] = [];

  private initialName: { [collectionCode: string]: string } = {};

  public collections: { [collectionCode: string]: Collection } = {};

  constructor(private linkTypeService: LinkTypeService,
              collectionService: CollectionService,
              route: ActivatedRoute,
              notificationService: NotificationsService,
              workspaceService: WorkspaceService) {
    super(collectionService, route, notificationService, workspaceService);
  }

  public ngOnInit(): void {
    this.refreshOnUrlChange();
    this.fetchAllCollections();
    this.setUninitializedCollection();
  }

  private refreshOnUrlChange(): void {
    this.route.url.forEach(params => {
      this.getCurrentCollection()
        .then(collection => collection && this.fetchLinkTypes(collection.code));
    });
  }

  private fetchAllCollections(): void {
    this.collectionService.getCollections()
      .retry(3)
      .subscribe(
        collections => collections.forEach(collection => this.collections[collection.code] = collection),
        error => this.notificationService.error('Error', 'Failed fetching collections')
      );
  }

  private setUninitializedCollection(): void {
    this.collections[COLLECTION_NO_CODE] = {
      code: COLLECTION_NO_CODE,
      icon: COLLECTION_NO_ICON,
      color: COLLECTION_NO_COLOR,
      name: '',
      attributes: []
    };
  }

  private fetchLinkTypes(collectionCode: string): void {
    this.linkTypes = [];
    this.getLinkTypes(collectionCode);
  }

  private getLinkTypes(collectionCode: string): void {
    this.linkTypeService.getLinkTypes(collectionCode)
      .retry(3)
      .subscribe(
        linkTypes => {
          // linkTypes.forEach(linkType => {
          //   // const collection =
          //   const firstAttributes = this.collections[linkType.toCollection].attributes.slice(0, linkType.toCollection.length);
          //   linkType.linkedAttributes =
          // });
          this.linkTypes = linkTypes;
        },
        error => this.notificationService.error('Error', 'Failed fetching Link Types')
      );
  }

  public possibleToCollectionCodes(linkType: LinkType): string[] {
    const excludedCodes = [COLLECTION_NO_CODE, linkType.toCollection, linkType.fromCollection];

    return Object
      .keys(this.collections)
      .filter(collectionCode => !excludedCodes.includes(collectionCode));
  }

  public initialized(linkType: LinkType): boolean {
    return linkType.name && linkType.toCollection !== COLLECTION_NO_CODE;
  }

  public newLinkType(): void {
    const emptyLinkType: LinkType = {
      fromCollection: this.collection.code,
      toCollection: COLLECTION_NO_CODE,
      name: '',
      linkedAttributes: []
    };

    this.linkTypeService.createLinkType(emptyLinkType)
      .retry(3)
      .subscribe(
        linkType => {
          this.linkTypes.push(linkType);
          setTimeout(() => this.linkTypeNameInput.last.nativeElement.focus());
        },
        error => this.notificationService.error('Error', 'Failed creating link type')
      );
  }

  public updateLinkType(linkType: LinkType, index: number): void {
    this.linkTypeService.updateLinkType(this.collection.code, this.initialName[linkType.toCollection], linkType)
      .retry(3)
      .subscribe(
        linkType => {
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

  public instanceCount(linkType: LinkType): number {
    return linkType.linkedAttributes
      .map(attribute => attribute.usageCount)
      .reduce((sum, current) => sum + current, 0);
  }

  public formatNumber(numberToFormat: number): string {
    const spaceBetweenEveryThreeDigits = /(?=(\d{3})+(?!\d))/g;
    const optionalCommaAtTheStart = /^,/;

    return String(numberToFormat)
      .replace(spaceBetweenEveryThreeDigits, ',')
      .replace(optionalCommaAtTheStart, '');
  }

}
