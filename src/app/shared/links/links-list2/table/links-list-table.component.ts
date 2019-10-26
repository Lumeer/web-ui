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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, SimpleChange} from '@angular/core';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkColumn} from '../model/link-column';
import {getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {ConstraintDataService} from '../../../../core/service/constraint-data.service';
import {LinkRow} from '../model/link-row';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectLinkInstancesByTypeAndDocuments} from '../../../../core/store/link-instances/link-instances.state';
import {map, mergeMap} from 'rxjs/operators';
import {
  getOtherLinkedDocumentId,
  getOtherLinkedDocumentIds,
  LinkInstance,
} from '../../../../core/store/link-instances/link.instance';
import {selectDocumentsByIds} from '../../../../core/store/documents/documents.state';
import {AttributeTypeModalComponent} from '../../../modal/attribute-type/attribute-type-modal.component';
import {ModalService} from '../../../modal/modal.service';

const columnWidth = 100;

@Component({
  selector: 'links-list-table',
  templateUrl: './links-list-table.component.html',
  styleUrls: ['./links-list-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableComponent implements OnChanges {
  @Input()
  public linkType: LinkType;

  @Input()
  public document: DocumentModel;

  @Input()
  public collection: Collection;

  public columns$ = new BehaviorSubject<LinkColumn[]>([]);

  public rows$: Observable<LinkRow[]>;
  public constraintData$: Observable<ConstraintData>;

  constructor(
    private constraintDataService: ConstraintDataService,
    private store$: Store<AppState>,
    private modalService: ModalService
  ) {
    this.constraintData$ = constraintDataService.observeConstraintData();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.linkType || changes.collection) {
      this.mergeColumns();
    }

    if (this.objectChanged(changes.linkType) || this.objectChanged(changes.document)) {
      this.rows$ = this.selectLinkRows$();
    }
  }

  private objectChanged(change: SimpleChange): boolean {
    return change && (!change.previousValue || change.previousValue.id !== change.currentValue.id);
  }

  private mergeColumns() {
    const linkTypeColumns = ((this.linkType && this.linkType.attributes) || []).reduce((columns, attribute) => {
      const column: LinkColumn = (this.columns$.value || []).find(
        c => c.linkTypeId === this.linkType.id && c.attribute.id === attribute.id
      ) || {attribute, width: columnWidth, linkTypeId: this.linkType.id};
      columns.push({...column, attribute});
      return columns;
    }, []);
    const defaultAttributeId = getDefaultAttributeId(this.collection);
    const collectionColumns = ((this.collection && this.collection.attributes) || []).reduce((columns, attribute) => {
      const column: LinkColumn = (this.columns$.value || []).find(
        c => c.collectionId === this.collection.id && c.attribute.id === attribute.id
      ) || {
        attribute,
        width: columnWidth,
        collectionId: this.collection.id,
        color: this.collection.color,
        bold: attribute.id === defaultAttributeId,
      };
      columns.push({...column, attribute});
      return columns;
    }, []);

    this.columns$.next([...linkTypeColumns, ...collectionColumns]);
  }

  private selectLinkRows$(): Observable<LinkRow[]> {
    if (this.linkType && this.document) {
      return this.store$.pipe(
        select(selectLinkInstancesByTypeAndDocuments(this.linkType.id, [this.document.id])),
        mergeMap(linkInstances => this.getLinkRowsForLinkInstances(linkInstances))
      );
    }

    return of([]);
  }

  private getLinkRowsForLinkInstances(linkInstances: LinkInstance[]): Observable<LinkRow[]> {
    const documentsIds = getOtherLinkedDocumentIds(linkInstances, this.document.id);
    return this.store$.pipe(
      select(selectDocumentsByIds(documentsIds)),
      map(documents => {
        return linkInstances.reduce((rows, linkInstance) => {
          const otherDocumentId = getOtherLinkedDocumentId(linkInstance, this.document.id);
          const document = documents.find(doc => doc.id === otherDocumentId);
          if (document) {
            rows.push({linkInstance, document});
          }
          return rows;
        }, []);
      })
    );
  }

  public onResizeColumn(data: {index: number; width: number}) {
    const columns = [...this.columns$.value];
    columns[data.index] = {...columns[data.index], width: data.width};
    this.columns$.next(columns);
  }

  public onAttributeType(column: LinkColumn) {
    this.modalService.showAttributeType(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public onAttributeFunction(column: LinkColumn) {
    this.modalService.showAttributeFunction(column.attribute.id, column.collectionId, column.linkTypeId);
  }
}
