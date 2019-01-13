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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {LinkType} from '../../../../core/store/link-types/link.type';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {selectCollectionsDictionary} from '../../../../core/store/collections/collections.state';
import {getOtherLinkedCollectionId} from '../../../utils/link-type.utils';
import {map, mergeMap} from 'rxjs/operators';
import {Observable, Subscription, BehaviorSubject} from 'rxjs';
import {selectLinkInstancesByTypeAndDocuments} from '../../../../core/store/link-instances/link-instances.state';
import {getOtherLinkedDocumentId, LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {selectDocumentsByIds} from '../../../../core/store/documents/documents.state';
import {LinkRowModel} from './link-row.model';
import {CorrelationIdGenerator} from '../../../../core/store/correlation-id.generator';
import {LinksListTableHeaderComponent} from './links-list-table-header/links-list-table-header.component';

const PAGE_SIZE = 100;

@Component({
  selector: 'links-list-table',
  templateUrl: './links-list-table.component.html',
  styleUrls: ['./links-list-table.component.scss', './links-list-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableComponent implements OnChanges, OnDestroy {
  @ViewChild(LinksListTableHeaderComponent)
  public headerComponent: LinksListTableHeaderComponent;

  @Input() public linkType: LinkType;

  @Input() public document: DocumentModel;

  @Output() public select = new EventEmitter<{collection: Collection; document: DocumentModel}>();

  @Output() public unlink = new EventEmitter<string>();

  public otherCollection$: Observable<Collection>;
  public linkRows$ = new BehaviorSubject<LinkRowModel[]>([]);
  public page = 0;
  public readonly pageSize = PAGE_SIZE;

  private lastSelection: {linkType: LinkType; document: DocumentModel};
  private linksSubscription = new Subscription();

  public constructor(private store: Store<AppState>) {}

  public ngOnDestroy() {
    this.linksSubscription.unsubscribe();
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.renewSubscriptions();
  }

  private renewSubscriptions() {
    if (this.linkType && this.document) {
      this.otherCollection$ = this.store.select(selectCollectionsDictionary).pipe(
        map(collectionsMap => {
          const collectionId = getOtherLinkedCollectionId(this.linkType, this.document.collectionId);
          return collectionsMap[collectionId];
        })
      );

      this.linksSubscription.unsubscribe();
      this.linksSubscription = this.store
        .select(selectLinkInstancesByTypeAndDocuments(this.linkType.id, [this.document.id]))
        .pipe(
          mergeMap(linkInstances =>
            this.fetchDocumentsForLinkInstances(linkInstances).pipe(
              map(documents => this.joinLinkInstancesWithDocuments(linkInstances, documents))
            )
          )
        )
        .subscribe(linkRows => this.handleNewLinkRows(linkRows));
    }
  }

  private fetchDocumentsForLinkInstances(linkInstances: LinkInstance[]): Observable<DocumentModel[]> {
    const documentsIds = this.convertLinkInstancesToDocumentIds(linkInstances, this.document.id);
    return this.store.select(selectDocumentsByIds(documentsIds));
  }

  private convertLinkInstancesToDocumentIds(linkInstances: LinkInstance[], documentId: string): string[] {
    return linkInstances.reduce((acc, linkInstance) => {
      const otherDocumentId = getOtherLinkedDocumentId(linkInstance, documentId);
      acc.push(otherDocumentId);
      return acc;
    }, []);
  }

  private joinLinkInstancesWithDocuments(linkInstances: LinkInstance[], documents: DocumentModel[]): LinkRowModel[] {
    return linkInstances.reduce((rows, linkInstance) => {
      const otherDocumentId = getOtherLinkedDocumentId(linkInstance, this.document.id);
      const document = documents.find(doc => doc.id === otherDocumentId);
      if (document) {
        rows.push({linkInstance, document});
      }
      return rows;
    }, []);
  }

  private handleNewLinkRows(linkRows: LinkRowModel[]) {
    if (
      this.lastSelection &&
      this.lastSelection.document === this.document &&
      this.lastSelection.linkType === this.linkType
    ) {
      this.mergeLinkRows(linkRows);
    } else {
      this.lastSelection = {linkType: this.linkType, document: this.document};
      this.linkRows$.next(linkRows);
    }
  }

  private mergeLinkRows(linkRows: LinkRowModel[]) {
    const currentLinkRows = this.linkRows$.getValue();
    const createdLinkRows = currentLinkRows.filter(linkRow => linkRow.document && linkRow.linkInstance);
    let emptyLinkRows = currentLinkRows.filter(linkRow => linkRow.correlationId);

    if (linkRows.length > createdLinkRows.length && emptyLinkRows.length > 0) {
      emptyLinkRows = emptyLinkRows.slice(1);
    }

    const newLinkRows = linkRows.concat(emptyLinkRows);
    this.linkRows$.next(newLinkRows);
  }

  public createNewLinkedDocument() {
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
        element.scrollIntoView();
      }
    });
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
