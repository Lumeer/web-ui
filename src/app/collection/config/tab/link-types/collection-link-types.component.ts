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

import {NotificationsService} from 'angular2-notifications';
import {switchMap, tap} from 'rxjs/operators';

import {COLLECTION_NO_CODE, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../../constants';
import {Collection} from '../../../../core/dto/collection';
import {CollectionTabComponent} from '../collection-tab.component';
import {LinkTypeService} from '../../../../core/rest/link-type.service';
import {LinkType} from '../../../../core/dto/link-type';
import {CollectionService} from '../../../../core/rest/collection.service';
import {WorkspaceService} from '../../../../core/workspace.service';
import {LinkedAttribute} from '../../../../core/dto/linked-attribute';
import {CollectionSelectService} from '../../../service/collection-select.service';

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
              protected notificationService: NotificationsService,
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
    this.fetchAllCollections();
    this.setUninitializedCollection();
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
        error => this.notificationService.error('Error', 'Failed fetching collections')
      );
  }

  private setUninitializedCollection(): void {
    this.collections[COLLECTION_NO_CODE] = {
      code: COLLECTION_NO_CODE,
      icon: COLLECTION_NO_ICON,
      color: COLLECTION_NO_COLOR,
      description: '',
      name: '',
      attributes: []
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

          if (!linkTypes[1]) {
            return;
          }

          const linkType = linkTypes[1];
          setTimeout(() => {
            const toCollection = this.collections[linkType.toCollection];
            const fromCollection = this.collections[linkType.fromCollection];

            const toFirstAttributes = toCollection.attributes.slice(0, 3);
            const toLinkedAttributes = toFirstAttributes.map(attribute => attribute as LinkedAttribute);
            toLinkedAttributes.forEach(linkedAttribute => linkedAttribute.collectionCode = toCollection.code);

            const fromFirstAttributes = fromCollection.attributes.slice(0, 2);
            const fromLinkedAttributes = fromFirstAttributes.map(attribute => attribute as LinkedAttribute);
            fromLinkedAttributes.forEach(linkedAttribute => linkedAttribute.collectionCode = fromCollection.code);

            linkType.linkedAttributes = fromLinkedAttributes.concat(toLinkedAttributes);

          }, 250);

          this.linkTypes = linkTypes;
        },
        error => this.notificationService.error('Error', 'Failed fetching Link Types')
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

  public linkTypeAttributes(linkType: LinkType): LinkedAttribute[] {
    let attributes;

    if (this.collections[linkType.toCollection] && this.collections[linkType.fromCollection]) {
      const fromAttributes = this
        .collections[linkType.fromCollection]
        .attributes
        .map(attribute => attribute as LinkedAttribute);
      fromAttributes.forEach(linkedAttribute => linkedAttribute.collectionCode = linkType.fromCollection);

      const toAttributes = this
        .collections[linkType.toCollection]
        .attributes
        .map(attribute => attribute as LinkedAttribute);
      toAttributes.forEach(linkedAttribute => linkedAttribute.collectionCode = linkType.toCollection);

      attributes = fromAttributes.concat(toAttributes);
    } else {
      attributes = [];
    }

    return attributes;
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
      linkType.linkedAttributes[0].collectionCode !== linkType.linkedAttributes[1].collectionCode;
  }

  public makeAutomatic(linkType: LinkType): void {
    linkType.automaticLinkFromAttribute = linkType.linkedAttributes[0].name;
    linkType.automaticLinkToAttribute = linkType.linkedAttributes[1].name;
  }

  public newLinkType(): void {
    const emptyLinkType: LinkType = {
      fromCollection: this.collection.code,
      toCollection: COLLECTION_NO_CODE,
      name: '',
      linkedAttributes: []
    };

    this.linkTypeService.createLinkTypeDeprecated(this.collection.code, emptyLinkType)
      .subscribe(
        linkType => {
          this.linkTypes.push(linkType);
          setTimeout(() => this.linkTypeNameInput.last.nativeElement.focus());
        },
        error => this.notificationService.error('Error', 'Failed creating link type')
      );
  }

  public updateLinkType(linkType: LinkType, index: number): void {
    this.linkTypeService.updateLinkTypeDeprecated(this.collection.code, this.initialName[linkType.toCollection], linkType)
      .subscribe(
        linkType => {
          this.linkTypes[index] = linkType;
          this.initialName[linkType.toCollection] = linkType.name;
        },
        error => this.notificationService.error('Error', 'Failed updating link type')
      );
  }

  public deleteLinkType(linkType: LinkType, idx: number): void {
    this.linkTypeService.removeLinkTypeDeprecated(this.collection.code, linkType)
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
