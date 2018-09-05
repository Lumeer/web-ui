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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';

import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AttributeModel, CollectionModel} from '../../../../core/store/collections/collection.model';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {selectCollectionsDictionary} from '../../../../core/store/collections/collections.state';
import {getOtherLinkedCollectionId} from '../../../utils/link-type.utils';
import {map, mergeMap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {selectLinkInstancesByTypeAndDocuments} from '../../../../core/store/link-instances/link-instances.state';
import {getOtherLinkedDocumentId, LinkInstanceModel} from '../../../../core/store/link-instances/link-instance.model';
import {selectDocumentsByIds} from '../../../../core/store/documents/documents.state';
import {LinkRowModel} from './link-row.model';
import {Subscription} from 'rxjs/internal/Subscription';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {CorrelationIdGenerator} from '../../../../core/store/correlation-id.generator';
import {isNullOrUndefined} from 'util';
import {LinkInstancesAction} from '../../../../core/store/link-instances/link-instances.action';

const PAGE_SIZE = 10;

@Component({
  selector: 'links-list-table',
  templateUrl: './links-list-table.component.html',
  styleUrls: ['./links-list-table.component.scss', './links-list-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinksListTableComponent implements OnChanges, OnDestroy {

  @Input() public linkType: LinkTypeModel;

  @Input() public document: DocumentModel;

  @Output() public select = new EventEmitter<{ collection: CollectionModel, document: DocumentModel }>();

  @Output() public unlink = new EventEmitter<string>();

  public collection$: Observable<CollectionModel>;

  public linkRows$ = new BehaviorSubject<LinkRowModel[]>([]);

  public page = 0;

  public readonly pageSize = PAGE_SIZE;

  private linksSubscription = new Subscription();

  public constructor(private store: Store<AppState>) {
  }

  public ngOnDestroy() {
    this.linksSubscription.unsubscribe();
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.renewSubscriptions();
  }

  private renewSubscriptions() {
    if (this.linkType && this.document) {
      this.collection$ = this.store.select(selectCollectionsDictionary).pipe(
        map(collectionsMap => {
          const collectionId = getOtherLinkedCollectionId(this.linkType, this.document.collectionId);
          return collectionsMap[collectionId];
        })
      );

      this.linksSubscription.unsubscribe();
      this.linksSubscription = this.store.select(selectLinkInstancesByTypeAndDocuments(this.linkType.id, [this.document.id])).pipe(
        mergeMap(linkInstances => this.fetchDocumentsForLinkInstances(linkInstances).pipe(
          map(documents => this.joinLinkInstancesWithDocuments(linkInstances, documents))
        ))
      ).subscribe(linkRows => this.mergeNewLinkRows(linkRows));
    }
  }

  private fetchDocumentsForLinkInstances(linkInstances: LinkInstanceModel[]): Observable<DocumentModel[]> {
    const documentsIds = this.convertLinkInstancesToDocumentIds(linkInstances, this.document.id);
    return this.store.select(selectDocumentsByIds(documentsIds));
  }

  private convertLinkInstancesToDocumentIds(linkInstances: LinkInstanceModel[], documentId: string): string[] {
    return linkInstances.reduce((acc, linkInstance) => {
      const otherDocumentId = getOtherLinkedDocumentId(linkInstance, documentId);
      acc.push(otherDocumentId);
      return acc;
    }, []);
  }

  private joinLinkInstancesWithDocuments(linkInstances: LinkInstanceModel[], documents: DocumentModel[]): LinkRowModel[] {
    return linkInstances.reduce((rows, linkInstance) => {
      const otherDocumentId = getOtherLinkedDocumentId(linkInstance, this.document.id);
      const document = documents.find(doc => doc.id === otherDocumentId);
      if (document) {
        rows.push({linkInstance, document});
      }
      return rows;
    }, []);
  }

  private mergeNewLinkRows(linkRows: LinkRowModel[]) {
    // TODO filter and merge
    this.linkRows$.next(linkRows);
  }

  public createNewLinkedDocumentIfNeeded() {
    const currentLinkRows = this.linkRows$.getValue();
    const correlationId = CorrelationIdGenerator.generate();
    this.linkRows$.next(currentLinkRows.concat([{correlationId}]));

    this.goToLastPage(currentLinkRows.length);
    this.scrollToNewLinkRow(correlationId);
  }

  private goToLastPage(sizeBeforeAdd: number) {
    this.page = Math.floor(sizeBeforeAdd / this.pageSize);
  }

  private scrollToNewLinkRow(correlationId: string) {
    setTimeout(() => {
      const element = document.getElementById(correlationId);
      if (element) {
        const scrollableParent = element.parentElement.parentElement.parentElement;
        if (scrollableParent) {
          scrollableParent.scrollTop = Number.MAX_SAFE_INTEGER;
        }
      }
    })
  }

  public removeLinkRowByCorrelationId(correlationId: string) {
    const currentLinkRows = this.linkRows$.getValue();
    const filteredLinkRows = currentLinkRows.filter(linkRow => linkRow.correlationId !== correlationId);

    const shouldEmitNewValue = currentLinkRows.length !== filteredLinkRows.length;
    if (shouldEmitNewValue) {
      this.linkRows$.next(filteredLinkRows);
      this.decrementPageIfNeeded(filteredLinkRows.length);
    }
  }

  private decrementPageIfNeeded(sizeAfterRemove: number) {
    const maximumPage = Math.ceil(sizeAfterRemove / this.pageSize);
    if (this.page >= maximumPage) {
      this.page--;
    }
  }

}
