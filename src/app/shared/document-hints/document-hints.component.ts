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
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, first, map, mergeMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {selectDocumentsByCustomQuery} from '../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {selectLinkInstanceById} from '../../core/store/link-instances/link-instances.state';
import {Query} from '../../core/store/navigation/query';
import {User} from '../../core/store/users/user';
import {selectAllUsers} from '../../core/store/users/users.state';
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
  public excludedDocumentIds: string[] = [];

  @Input()
  public limit = 10;

  @Input()
  public linkedDocumentId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public linkInstanceId: string;

  @Input()
  public correlationId: string;

  @Input()
  public value: string;

  @Input()
  public calculatePosition: boolean = true;

  @Output()
  public useHint = new EventEmitter();

  public collection$: Observable<Collection>;
  public documents$: Observable<DocumentModel[]>;
  public users$: Observable<User[]>;

  public selectedIndex$ = new BehaviorSubject<number>(-1);
  private filter$ = new BehaviorSubject<string>('');

  private hintsCount = 0;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.bindDocuments();
    this.users$ = this.store$.pipe(select(selectAllUsers));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value) {
      this.filter$.next(this.value);
    }
    if (changes.collectionId && this.collectionId) {
      this.collection$ = this.store$.pipe(select(selectCollectionById(this.collectionId)));
    }
  }

  private bindDocuments() {
    const query: Query = {
      stems: [{collectionId: this.collectionId}],
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
                  String(value)
                    .toLowerCase()
                    .includes(String(typedValue).toLowerCase())
                );
              })
              .slice(0, this.limit)
          ),
          tap(hints => (this.hintsCount = hints.length))
        )
      )
    );
  }

  public createLink(document: DocumentModel, data: Record<string, any> = {}) {
    this.store$.dispatch(
      new LinkInstancesAction.Create({
        linkInstance: {
          correlationId: this.correlationId,
          linkTypeId: this.linkTypeId,
          documentIds: [this.linkedDocumentId, document.id],
          data,
        },
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
        take(1),
        map(documents => documents[index]),
        filter(document => !!document)
      )
      .subscribe(document => this.onUseDocument(document));
  }

  public onUseDocument(document: DocumentModel) {
    this.useHint.emit();

    if (this.linkInstanceId) {
      this.createLinkWithExistingLinkData(document);
    } else {
      this.createLink(document);
    }
  }

  private createLinkWithExistingLinkData(document: DocumentModel) {
    this.store$
      .pipe(
        select(selectLinkInstanceById(this.linkInstanceId)),
        take(1),
        filter(linkInstance => !!linkInstance)
      )
      .subscribe(linkInstance => this.createLink(document, linkInstance.data));
  }

  public clearSelection() {
    this.selectedIndex$.next(-1);
  }

  public isSelected(): boolean {
    return this.selectedIndex$.getValue() > -1;
  }
}
