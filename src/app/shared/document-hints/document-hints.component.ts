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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {filter, map, mergeMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {selectDocumentsByCustomQuery} from '../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {selectLinkInstanceById} from '../../core/store/link-instances/link-instances.state';
import {Query} from '../../core/store/navigation/query/query';
import {User} from '../../core/store/users/user';
import {selectAllUsers} from '../../core/store/users/users.state';
import {Direction} from '../direction';
import {DropdownPosition} from '../dropdown/dropdown-position';
import {DropdownComponent} from '../dropdown/dropdown.component';
import {DocumentHintColumn} from './document-hint-column';
import {getOtherLinkedDocumentId} from '../../core/store/link-instances/link.instance';
import {selectDocumentById} from '../../core/store/documents/documents.state';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {escapeHtml, isNotNullOrUndefined, preventEvent} from '../utils/common.utils';
import {findAttributeConstraint} from '../../core/store/collections/collection.util';
import {stripTextHtmlTags} from '../utils/data.utils';
import {isTopPositionDropdown} from '../dropdown/util/dropdown-util';
import {ConstraintData, DataValue, UnknownConstraint} from '@lumeer/data-filters';

@Component({
  selector: 'document-hints',
  templateUrl: './document-hints.component.html',
  styleUrls: ['./document-hints.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentHintsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
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
  public dataValue: DataValue;

  @Input()
  public offsetLeft: number;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public createLinkDirectly = true;

  @Output()
  public useHint = new EventEmitter<{document: DocumentModel; external: boolean}>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomStart, DropdownPosition.TopStart];

  public collection$: Observable<Collection>;
  public documents$: Observable<DocumentModel[]>;
  public users$: Observable<User[]>;

  public minWidth: number;
  public selectedIndex$ = new BehaviorSubject<number>(-1);
  public filter$ = new BehaviorSubject<string>('');
  public dropdownPosition$ = new BehaviorSubject<DropdownPosition>(null);

  private hintsCount = 0;
  private confirmedSelectedIndex: number;

  private lastMouseTargetId: string;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.users$ = this.store$.pipe(select(selectAllUsers));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.dataValue && this.dataValue) {
      this.filter$.next(this.dataValue.format());
    }
    if (changes.collectionId && this.collectionId) {
      this.collection$ = this.store$.pipe(select(selectCollectionById(this.collectionId)));
      this.bindDocuments();
    }

    this.minWidth = (this.columns || []).reduce((width, column) => width + column.width, 0);
  }

  private bindDocuments() {
    const query: Query = {
      stems: [{collectionId: this.collectionId}],
    };

    const documents$ = this.store$
      .select(selectDocumentsByCustomQuery(query, true))
      .pipe(
        map(documents =>
          documents.filter(
            document => document.data[this.attributeId] && !this.excludedDocumentIds.includes(document.id)
          )
        )
      );

    this.documents$ = combineLatest([documents$, this.collection$]).pipe(
      mergeMap(([documents, collection]) =>
        this.filter$.pipe(
          map(typedValue => escapeHtml(stripTextHtmlTags(String(typedValue || ''), false).toLowerCase())),
          map(typedValue => {
            const constraint =
              findAttributeConstraint(collection?.attributes, this.attributeId) || new UnknownConstraint();
            return documents
              .filter(document => {
                const value = document.data[this.attributeId];
                const formattedValue = isNotNullOrUndefined(value)
                  ? constraint.createDataValue(value, this.constraintData).format()
                  : '';
                return stripTextHtmlTags(String(formattedValue), false).toLowerCase().includes(typedValue);
              })
              .slice(0, this.limit);
          }),
          tap(hints => (this.hintsCount = hints.length))
        )
      )
    );
  }

  public ngAfterViewInit() {
    this.open();
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open(this.offsetLeft);
    }
  }

  public ngOnDestroy() {
    this.close();
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
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
    const isTopPosition = isTopPositionDropdown(this.dropdownPosition$.value);

    if (isTopPosition) {
      if (direction === Direction.Up && (index > 0 || index === -1)) {
        this.selectedIndex$.next(index === -1 ? this.hintsCount - 1 : index - 1);
      }
      if (direction === Direction.Down && index < this.hintsCount) {
        this.selectedIndex$.next(index === this.hintsCount - 1 ? -1 : index + 1);
      }
    } else {
      if (direction === Direction.Up && index > -1) {
        this.selectedIndex$.next(index - 1);
      }
      if (direction === Direction.Down && index < this.hintsCount - 1) {
        this.selectedIndex$.next(index + 1);
      }
    }
  }

  public onDropdownPositionChange(position: DropdownPosition) {
    const wasTopPosition = isTopPositionDropdown(this.dropdownPosition$.value);
    const isTopPosition = isTopPositionDropdown(position);

    if (wasTopPosition !== isTopPosition && this.isSelected()) {
      const newSelection = this.hintsCount - this.selectedIndex$.value - 1;
      if (newSelection >= 0) {
        this.selectedIndex$.next(newSelection);
      }
    }
    this.dropdownPosition$.next(position);
  }

  private getReversedSelection(): number {
    const isTopPosition = isTopPositionDropdown(this.dropdownPosition$.value);
    if (this.selectedIndex$.value >= 0 && isTopPosition) {
      return this.hintsCount - this.selectedIndex$.value - 1;
    }
    return this.selectedIndex$.value;
  }

  public useSelection() {
    const index = this.getReversedSelection();
    if (index < 0) {
      return;
    }

    this.documents$
      .pipe(
        take(1),
        map(documents => documents[index]),
        filter(document => !!document)
      )
      .subscribe(document => this.onUseDocument(index, document, !this.createLinkDirectly, true));
  }

  public onUseDocument(index: number, document: DocumentModel, emit = true, external = false) {
    this.confirmedSelectedIndex = index;
    emit && this.useHint.emit({document, external});

    if (this.createLinkDirectly) {
      if (this.linkInstanceId) {
        this.createLinkWithExistingLinkData(document);
      } else {
        this.createLink(document);
      }
    } else {
      this.close();
    }
  }

  private createLinkWithExistingLinkData(document: DocumentModel) {
    this.store$
      .pipe(
        select(selectLinkInstanceById(this.linkInstanceId)),
        filter(linkInstance => !!linkInstance),
        mergeMap(oldLinkInstance => {
          const otherDocumentId = getOtherLinkedDocumentId(oldLinkInstance, this.linkedDocumentId);
          return this.store$.pipe(
            select(selectDocumentById(otherDocumentId)),
            map(oldDocument => ({oldDocument, oldLinkInstance}))
          );
        }),
        take(1)
      )
      .subscribe(({oldDocument, oldLinkInstance}) => {
        const documentIds: [string, string] = [this.linkedDocumentId, document.id];
        const linkInstance = {...oldLinkInstance, documentIds, correlationId: this.correlationId};
        let nextAction = null;
        if (oldDocument && Object.keys(oldDocument?.data || {}).length === 0) {
          nextAction = new DocumentsAction.Delete({documentId: oldDocument.id, collectionId: oldDocument.collectionId});
        }
        this.store$.dispatch(new LinkInstancesAction.Update({linkInstance, nextAction}));
      });
  }

  public clearSelection() {
    this.selectedIndex$.next(-1);
  }

  public isSelected(): boolean {
    return this.selectedIndex$.getValue() > -1;
  }

  public isSelectionConfirmed(): boolean {
    return this.confirmedSelectedIndex > -1;
  }

  public preventEvent(event: MouseEvent) {
    this.lastMouseTargetId = this.parseTargetId(event);
    preventEvent(event);
  }

  private parseTargetId(event: MouseEvent): string {
    const target = event?.target as HTMLElement;
    const targetParts = target.id.split('-');

    if (targetParts?.length > 2) {
      return targetParts[1];
    }

    return null;
  }

  public tryUseDocument(event: MouseEvent, index: number, document: DocumentModel) {
    preventEvent(event);

    const target = this.parseTargetId(event);
    if (target === this.lastMouseTargetId) {
      this.onUseDocument(index, document);
    }
    this.lastMouseTargetId = null;
  }
}
