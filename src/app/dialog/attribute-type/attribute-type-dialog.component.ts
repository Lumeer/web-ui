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

import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs';
import {filter, map, mergeMap, tap} from 'rxjs/operators';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {AttributeTypeFormComponent} from './form/attribute-type-form.component';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {DialogService} from '../dialog.service';
import {Attribute, Collection} from '../../core/store/collections/collection';

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
  public attribute$: Observable<Attribute>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private store$: Store<{}>
  ) {}

  public ngOnInit() {
    this.collection$ = this.selectCollection();
    this.attribute$ = this.selectAttribute(this.collection$);
  }

  private selectCollection(): Observable<Collection> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('collectionId')),
      filter(collectionId => !!collectionId),
      mergeMap(collectionId => this.store$.pipe(select(selectCollectionById(collectionId))))
    );
  }

  private selectAttribute(collection$: Observable<Collection>): Observable<Collection> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('attributeId')),
      filter(attributeId => !!attributeId),
      mergeMap(attributeId =>
        collection$.pipe(
          map(collection => collection && collection.attributes.find(attribute => attribute.id === attributeId)),
          filter(attribute => !!attribute)
        )
      )
    );
  }

  public onAttributeChange(collectionId: string, attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.ChangeAttribute({
        collectionId,
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
