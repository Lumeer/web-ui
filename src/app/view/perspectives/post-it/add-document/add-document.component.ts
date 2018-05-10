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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../core/store/app.state';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {selectCollectionsByQuery} from '../../../../core/store/collections/collections.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {CorrelationIdGenerator} from '../../../../core/store/correlation-id.generator';

@Component({
  selector: 'add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss']
})
export class PostItAddDocumentComponent implements OnInit, OnDestroy {

  @Input()
  public hasCollection: boolean;

  @Input()
  public hasRights: boolean;

  @Output()
  public createPostIt = new EventEmitter<DocumentModel>();

  public selectedCollection: CollectionModel;

  private collectionSubscription: Subscription;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.collectionSubscription = this.store.select(selectCollectionsByQuery).subscribe((collections: CollectionModel[]) => {
      this.selectedCollection = collections.length === 1 ? collections[0] : null;
    });
  }

  public onClick(): void {
    this.createPostIt.emit({
      collectionId: this.selectedCollection.id,
      correlationId: CorrelationIdGenerator.generate(),
      data: this.createData()
    });
  }

  private createData(): { [attributeId: string]: any } {
    if (!this.selectedCollection) {
      return [];
    }
    return this.selectedCollection.attributes.reduce((acc, attr)=>{
      acc[attr.id] = '';
      return acc;
    }, {});
  }

  public disabled(): boolean {
    return !this.hasRights || !this.hasCollection;
  }

  public ngOnDestroy(): void {
    this.collectionSubscription.unsubscribe();
  }

}
