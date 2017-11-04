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

import {Component, ElementRef, OnInit, QueryList, ViewChildren} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {COLLECTION_NO_CODE, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../../constants';
import {Collection} from '../../../../core/dto/collection';
import {CollectionTabComponent} from '../collection-tab.component';
import {LinkTypeService} from '../../../../core/rest/link-type.service';
import {LinkType} from '../../../../core/dto/link-type';
import {CollectionService} from '../../../../core/rest/collection.service';
import {WorkspaceService} from '../../../../core/workspace.service';
import {LinkedAttribute} from '../../../../core/dto/linked-attribute';
import {CollectionSelectService} from '../../../service/collection-select.service';
import {NotificationService} from '../../../../notifications/notification.service';
import {switchMap, tap} from 'rxjs/operators';

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
              private router: Router,
              protected collectionService: CollectionService,
              protected collectionSelectService: CollectionSelectService,
              protected route: ActivatedRoute,
              protected notificationService: NotificationService,
              protected workspaceService: WorkspaceService) {
    super(
      collectionService,
      collectionSelectService,
      route,
      notificationService,
      workspaceService
    );
  }

  public ngOnInit(): void {
    super.ngOnInit();

    this.collections[COLLECTION_NO_CODE] = this.uninitializedCollection();
    this.fetchAllCollections();
    this.fetchLinkTypes(this.collection.code);
  }

  public changeCollection(toCollection: string): void {
    this.collectionSelectService.select(toCollection).pipe(
      switchMap(collection => this.router.navigate([this.workspacePath(), 'c', collection.code, 'linktypes'])),
      tap(navigated => this.fetchAllCollections())
    ).subscribe(navigated => this.fetchLinkTypes(this.collection.code));
  }

  private fetchAllCollections(): void {
    this.collectionService.getCollections()
      .subscribe(
        collections => collections.forEach(collection => this.collections[collection.code] = collection),
        error => this.notificationService.error('Failed fetching collections')
      );
  }

  private uninitializedCollection(): Collection {
    return {
      code: COLLECTION_NO_CODE,
      icon: COLLECTION_NO_ICON,
      color: COLLECTION_NO_COLOR,
      description: '',
      name: '',
      attributes: []
    };
  }

  public emptyLinkType(): LinkType {
    return {
      fromCollection: this.collection.code,
      toCollection: COLLECTION_NO_CODE,
      name: '',
      linkedAttributes: []
    };
  }

  private fetchLinkTypes(collectionCode: string): void {
    this.linkTypes = [];
    this.getLinkTypes(collectionCode);
  }

  private getLinkTypes(collectionCode: string): void {
    this.linkTypeService.getLinkTypesDeprecated(collectionCode)
      .subscribe(
        linkTypes => {
          // TODO remove this whole block after service gets implemented on backend
          if (linkTypes[1]) {
            setTimeout(() => {
              const linkType = linkTypes[1];

              const randomIndex = list => Math.floor(Math.random() * list.length);
              const insertCollectionAttributes = (result, collectionCode) => {
                const collection = this.collections[collectionCode];
                collection.attributes
                  .slice(0, randomIndex(collection.attributes))
                  .forEach(attribute => result.push({collection: collection, value: attribute}));
              };

              const linkedAttributes: LinkedAttribute[] = [];
              insertCollectionAttributes(linkedAttributes, linkType.fromCollection);
              insertCollectionAttributes(linkedAttributes, linkType.toCollection);

              linkType.linkedAttributes = linkedAttributes;

            }, 250);
          }

          this.linkTypes = linkTypes;
        },
        error => this.notificationService.error('Failed fetching Link Types')
      );
  }

  public newLinkType(): void {
    this.linkTypeService.createLinkTypeDeprecated(this.collection.code, this.emptyLinkType())
      .subscribe(
        linkType => {
          this.linkTypes.push(linkType);
          setTimeout(() => this.linkTypeNameInput.last.nativeElement.focus());
        },
        error => this.notificationService.error('Failed creating link type')
      );
  }

  public updateLinkType(linkType: LinkType, index: number): void {
    this.linkTypeService.updateLinkTypeDeprecated(this.collection.code, this.initialName[linkType.toCollection], linkType)
      .subscribe(
        linkType => {
          this.linkTypes[index] = linkType;
          this.initialName[linkType.toCollection] = linkType.name;
        },
        error => this.notificationService.error('Failed updating link type')
      );
  }

  public deleteLinkType(linkType: LinkType, idx: number): void {
    this.linkTypeService.removeLinkTypeDeprecated(this.collection.code, linkType)
      .subscribe(
        () => this.linkTypes.splice(idx, 1),
        error => this.notificationService.error('Failed removing link type')
      );
  }

  public possibleToCollectionCodes(linkType?: LinkType): string[] {
    const excludedCodes = [COLLECTION_NO_CODE];

    if (linkType) {
      excludedCodes.push(linkType.toCollection);
      excludedCodes.push(linkType.fromCollection);
    }

    return Object
      .keys(this.collections)
      .filter(collectionCode => !excludedCodes.includes(collectionCode));
  }

  public initialized(linkType: LinkType): boolean {
    return linkType.name && linkType.toCollection !== COLLECTION_NO_CODE;
  }

  public isAutomatic(linkType: LinkType): boolean {
    return !!(linkType.automaticLinkToAttribute && linkType.automaticLinkFromAttribute);
  }

  public canBecomeAutomatic(linkType: LinkType): boolean {
    return !this.isAutomatic(linkType) &&
      linkType.linkedAttributes.length === 2 &&
      linkType.linkedAttributes[0].collection.code !== linkType.linkedAttributes[1].collection.code;
  }

  public makeAutomatic(linkType: LinkType): void {
    linkType.automaticLinkFromAttribute = linkType.linkedAttributes[0].value.name;
    linkType.automaticLinkToAttribute = linkType.linkedAttributes[1].value.name;
  }

  public instanceCount(linkType: LinkType): number {
    return linkType.linkedAttributes
      .map(linkedAttribute => linkedAttribute.value.usageCount)
      .reduce((sum, current) => sum + current, 0);
  }

  public formatNumber(numberToFormat: number): string {
    const spaceBetweenEveryThreeDigits = /(?=(\d{3})+(?!\d))/g;
    const optionalCommaAtTheStart = /^,/;

    return String(numberToFormat)
      .replace(spaceBetweenEveryThreeDigits, ',')
      .replace(optionalCommaAtTheStart, '');
  }

  public searchLinkTypesQueryParams(linkType: LinkType): object {
    return {
      query: JSON.stringify({linkNames: [linkType.name]})
    };
  }

}
