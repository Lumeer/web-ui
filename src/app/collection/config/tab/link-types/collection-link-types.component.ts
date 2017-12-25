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
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {finalize, map, switchMap} from 'rxjs/operators';
import {Collection} from '../../../../core/dto';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {CollectionService, LinkTypeService} from '../../../../core/rest';
import {AppState} from '../../../../core/store/app.state';

import {COLLECTION_NO_CODE, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../../constants';
import {CollectionSelectService} from '../../../service/collection-select.service';
import {CollectionTabComponent} from '../collection-tab.component';
import {LinkTypeModel} from './LinkTypeModel';

@Component({
  selector: 'collection-link-types',
  templateUrl: './collection-link-types.component.html',
  styleUrls: ['./collection-link-types.component.scss']
})
export class CollectionLinkTypesComponent extends CollectionTabComponent implements OnInit {

  @ViewChildren('name')
  public linkTypeNameInput: QueryList<ElementRef>;

  public linkTypes: LinkTypeModel[] = [];

  public collections: { [collectionCode: string]: Collection } = {};

  constructor(private linkTypeService: LinkTypeService,
              private router: Router,
              collectionService: CollectionService,
              collectionSelectService: CollectionSelectService,
              notificationService: NotificationService,
              store: Store<AppState>) {
    super(
      collectionService,
      collectionSelectService,
      notificationService,
      store
    );
  }

  public ngOnInit(): void {
    super.ngOnInit();

    this.collectionService.getCollections().subscribe(
      collections => {
        collections.forEach(collection => this.collections[collection.code] = collection);
        this.initializeLinkTypes();
      },
      error => {
        this.notificationService.error('Failed fetching files');
      }
    );
  }

  private initializeLinkTypes(): void {
    this.linkTypes = [];
    this.linkTypeService.getLinkTypes({collectionCodes: [this.collection.code]}).pipe(
      map(linkTypes => linkTypes.filter(linkType => linkType.collectionCodes[0] === this.collection.code))
    ).subscribe(
      linkTypes => this.linkTypes = linkTypes.map(linkType => new LinkTypeModel(linkType)),
      error => this.notificationService.error('Failed fetching LinkTypes')
    );
  }

  public changeCollection(collectionCode: string): void {
    if (!collectionCode) {
      return;
    }

    this.collectionSelectService
      .select(collectionCode).pipe(
      switchMap(collection => this.router.navigate([this.workspacePath(), 'c', collection.code, 'linktypes']))
    ).subscribe(
      navigated => this.initializeLinkTypes(),
      error => this.notificationService.error('Failed switching file')
    );
  }

  public emptyLinkType(): LinkTypeModel {
    return new LinkTypeModel(null, this.collection.code);
  }

  public addLinkType(): void {
    const newLinkType = this.emptyLinkType();
    this.linkTypes.push(newLinkType);
    setTimeout(() => this.linkTypeNameInput.last && this.linkTypeNameInput.last.nativeElement.focus());
  }

  public createLinkType(linkTypeModel: LinkTypeModel): void {
    if (linkTypeModel.initialized) {
      throw new Error(`Link Type Model ${linkTypeModel} already initialized`);
    }

    if (linkTypeModel.initializing) {
      return;
    }

    linkTypeModel.initializing = true;
    this.linkTypeService.createLinkType(linkTypeModel.data)
      .pipe(
        finalize(() => linkTypeModel.initializing = false)
      )
      .subscribe(
        linkType => {
          linkTypeModel.initialized = true;
          linkTypeModel.data.id = linkType.id;
        },
        error => {
          this.notificationService.error('Failed creating link type');
        }
      );
  }

  public updateLinkType(linkTypeModel: LinkTypeModel): void {
    this.linkTypeService.updateLinkType(linkTypeModel.data.id, linkTypeModel.data).subscribe(
      linkType => linkTypeModel.data = linkType,
      error => this.notificationService.error('Failed updating link type')
    );
  }

  public changeToCollection(linkTypeModel: LinkTypeModel, collectionCode: string): void {
    this.notificationService.confirm('Are you sure you want to change linked file?', 'Delete?', [
      {
        text: 'Yes', action: () => {
        linkTypeModel.changeLinkedCollection(collectionCode);
        this.updateLinkType(linkTypeModel);
      }, bold: false
      },
      {
        text: 'No'
      }
    ]);
  }

  public deleteLinkType(linkTypeModel: LinkTypeModel): void {
    this.notificationService.confirm('Are you sure you want to delete link type?', 'Delete?', [
      {
        text: 'Yes', action: () => {
        this.linkTypeService.deleteLinkType(linkTypeModel.data.id).subscribe(
          () => this.removeLinkType(linkTypeModel),
          error => this.notificationService.error('Failed removing link type')
        );
      }, bold: false
      },
      {
        text: 'No'
      }
    ]);
  }

  public removeLinkType(removedLinkTypeModel: LinkTypeModel): void {
    const index = this.linkTypes.findIndex(linkTypeModel => linkTypeModel === removedLinkTypeModel);
    if (index !== -1) {
      this.linkTypes.splice(index, 1);
    }
  }

  public getLinkedCollection(linkTypeModel: LinkTypeModel): Collection {
    if (linkTypeModel.initialized) {
      return this.collections[linkTypeModel.data.collectionCodes[1]];
    } else {
      return {
        code: COLLECTION_NO_CODE,
        icon: COLLECTION_NO_ICON,
        color: COLLECTION_NO_COLOR,
        name: '',
        description: '',
        attributes: []
      };
    }
  }

  public possibleToCollectionCodes(linkTypeModel: LinkTypeModel): string[] {
    const excludedCodes = [this.collection.code];

    if (linkTypeModel.initialized) {
      excludedCodes.push(linkTypeModel.data.collectionCodes[1]);
    }

    return Object
      .keys(this.collections)
      .filter(collectionCode => !excludedCodes.includes(collectionCode));
  }

  public isAutomatic(linkTypeModel: LinkTypeModel): boolean {
    return linkTypeModel.data.automaticallyLinked && linkTypeModel.data.automaticallyLinked.length === 2;
  }

  public canBecomeAutomatic(linkTypeModel: LinkTypeModel): boolean {
    return !this.isAutomatic(linkTypeModel) &&
      linkTypeModel.data.linkedAttributes.length === 2 &&
      linkTypeModel.data.linkedAttributes[0].collection.code !== linkTypeModel.data.linkedAttributes[1].collection.code;
  }

  public makeAutomatic(linkTypeModel: LinkTypeModel): void {
    linkTypeModel.data.automaticallyLinked = [linkTypeModel.data.linkedAttributes[0], linkTypeModel.data.linkedAttributes[1]];
    this.updateLinkType(linkTypeModel);
  }

  public instanceCount(linkTypeModel: LinkTypeModel): number {
    return linkTypeModel.data.linkedAttributes
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

  public searchLinkTypesQueryParams(linkTypeModel: LinkTypeModel): object {
    return {
      query: JSON.stringify({linkNames: [linkTypeModel.data.name]})
    };
  }

}
