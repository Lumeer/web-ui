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

import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, of} from 'rxjs';
import {filter, map, mergeMap} from 'rxjs/operators';
import {Attribute, Collection} from '../../core/store/collections/collection';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionById, selectCollectionsByLinkType} from '../../core/store/collections/collections.state';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';
import {selectLinkTypeById} from '../../core/store/link-types/link-types.state';
import {LinkType} from '../../core/store/link-types/link.type';
import {DialogService} from '../dialog.service';
import {AttributeTypeFormComponent} from './form/attribute-type-form.component';

@Component({
  selector: 'attribute-type-dialog',
  templateUrl: './attribute-type-dialog.component.html',
  styleUrls: ['./attribute-type-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeTypeDialogComponent implements OnInit {
  @ViewChild(AttributeTypeFormComponent)
  public constraintForm: AttributeTypeFormComponent;

  public collection$: Observable<Collection>;
  public linkType$: Observable<LinkType>;
  public linkCollections$: Observable<Collection[]>;
  public attribute$: Observable<Attribute>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private store$: Store<{}>
  ) {}

  public ngOnInit() {
    this.collection$ = this.selectCollection();
    this.linkType$ = this.selectLinkType();

    this.linkCollections$ = this.selectLinkCollections(this.linkType$);

    const attributes$ = this.selectAttributes(this.collection$, this.linkType$);
    this.attribute$ = this.selectAttribute(attributes$);
  }

  private selectCollection(): Observable<Collection> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('collectionId')),
      mergeMap(collectionId => (collectionId ? this.store$.pipe(select(selectCollectionById(collectionId))) : of(null)))
    );
  }

  private selectLinkType(): Observable<LinkType> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('linkTypeId')),
      mergeMap(linkTypeId => (linkTypeId ? this.store$.pipe(select(selectLinkTypeById(linkTypeId))) : of(null)))
    );
  }

  private selectLinkCollections(linkType$: Observable<LinkType>): Observable<Collection[]> {
    return linkType$.pipe(
      mergeMap(linkType => (linkType ? this.store$.pipe(select(selectCollectionsByLinkType(linkType.id))) : of([])))
    );
  }

  private selectAttributes(
    collection$: Observable<Collection>,
    linkType$: Observable<LinkType>
  ): Observable<Attribute[]> {
    return combineLatest(collection$, linkType$).pipe(
      map(([collection, linkType]) => {
        if (collection) {
          return collection.attributes;
        }
        if (linkType) {
          return linkType.attributes;
        }
        return [];
      })
    );
  }

  private selectAttribute(attributes$: Observable<Attribute[]>): Observable<Collection> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('attributeId')),
      filter(attributeId => !!attributeId),
      mergeMap(attributeId =>
        attributes$.pipe(
          map(attributes => attributes.find(attribute => attribute.id === attributeId)),
          filter(attribute => !!attribute)
        )
      )
    );
  }

  public onAttributeChange(collectionId: string, linkTypeId: string, attribute: Attribute) {
    if (collectionId) {
      this.updateCollectionAttribute(collectionId, attribute);
    }
    if (linkTypeId) {
      this.updateLinkTypeAttribute(linkTypeId, attribute);
    }
  }

  private updateCollectionAttribute(collectionId: string, attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.ChangeAttribute({
        collectionId,
        attributeId: attribute.id,
        attribute,
      })
    );
    this.dialogService.closeDialog();
  }

  private updateLinkTypeAttribute(linkTypeId: string, attribute: Attribute) {
    this.store$.dispatch(
      new LinkTypesAction.UpdateAttribute({
        linkTypeId,
        attributeId: attribute.id,
        attribute,
        onSuccess: () => this.dialogService.closeDialog(),
      })
    );
  }

  public onSubmit() {
    this.constraintForm.onSubmit();
  }
}
