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
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, first, map, mergeMap, tap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {DocumentModel} from '../../core/store/documents/document.model';
import {selectDocumentsByCustomQuery} from '../../core/store/common/permissions.selectors';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Direction} from '../direction';
import {DocumentHintColumn} from './document-hint-column';

@Component({
  selector: 'document-hints',
  templateUrl: './document-hints.component.html',
  styleUrls: ['./document-hints.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentHintsComponent implements OnInit, OnChanges {
  @Input()
  public attributeId: string;

  @Input()
  public collectionId: string;

  @Input()
  public columns: DocumentHintColumn[];

  @Input()
  public createLinkCallback: (linkInstanceId: string, documentId: string) => void;

  @Input()
  public excludedDocumentIds: string[] = [];

  @Input()
  public limit = 10;

  @Input()
  public linkedDocumentId;

  @Input()
  public linkTypeId: string;

  @Input()
  public value: string;

  @Input()
  public calculatePosition: boolean = true;

  @Output()
  public linkCreate = new EventEmitter();

  public documents$: Observable<DocumentModel[]>;
  public selectedIndex$ = new BehaviorSubject<number>(-1);
  private filter$ = new BehaviorSubject<string>('');

  private hintsCount = 0;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.bindDocuments();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value) {
      this.filter$.next(this.value);
    }
  }

  private bindDocuments() {
    const query: QueryModel = {
      collectionIds: [this.collectionId],
    };

    this.documents$ = this.store$.select(selectDocumentsByCustomQuery(query)).pipe(
      map(documents =>
        documents.filter(document => document.data[this.attributeId] && !this.excludedDocumentIds.includes(document.id))
      ),
      mergeMap(documents =>
        this.filter$.pipe(
          map(typedValue =>
            documents
              .filter(document => {
                const value = document.data[this.attributeId];
                return (
                  value &&
                  value
                    .toString()
                    .toLowerCase()
                    .includes(typedValue.toLowerCase())
                );
              })
              .slice(0, this.limit)
          ),
          tap(hints => (this.hintsCount = hints.length))
        )
      )
    );
  }

  public onCreateLink(document: DocumentModel) {
    this.linkCreate.emit();

    this.store$.dispatch(
      new LinkInstancesAction.Create({
        linkInstance: {
          linkTypeId: this.linkTypeId,
          documentIds: [this.linkedDocumentId, document.id],
        },
        callback: this.createLinkCallback
          ? linkInstanceId => this.createLinkCallback(linkInstanceId, document.id)
          : null,
      })
    );
  }

  public moveSelection(direction: Direction) {
    const index = this.selectedIndex$.getValue();

    if (direction === Direction.Up && index > -1) {
      this.selectedIndex$.next(index - 1);
    }
    if (direction === Direction.Down && index < this.hintsCount - 1) {
      this.selectedIndex$.next(index + 1);
    }
  }

  public useSelection() {
    const index = this.selectedIndex$.getValue();
    if (index < 0) {
      return;
    }

    this.documents$
      .pipe(
        first(),
        map(documents => documents[index]),
        filter(document => !!document)
      )
      .subscribe(document => this.onCreateLink(document));
  }

  public clearSelection() {
    this.selectedIndex$.next(-1);
  }

  public isSelected(): boolean {
    return this.selectedIndex$.getValue() > -1;
  }
}
