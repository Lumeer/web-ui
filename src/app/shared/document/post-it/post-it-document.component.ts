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
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {SelectionHelper} from './util/selection-helper';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {Query} from '../../../core/store/navigation/query';
import {DocumentUi} from '../../../core/ui/document-ui';
import {AppState} from '../../../core/store/app.state';
import {NotificationService} from '../../../core/notifications/notification.service';
import {KeyCode} from '../../key-code';
import {UiRow} from '../../../core/ui/ui-row';
import {getDefaultAttributeId} from '../../../core/store/collections/collection.util';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItDocumentComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public documentModel: DocumentModel;

  @Input()
  public index: number;

  @Input()
  public collection: Collection;

  @Input()
  public perspectiveId: string;

  @Input()
  public selectionHelper: SelectionHelper;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissions;

  @Output() public remove = new EventEmitter();
  @Output() public sizeChange = new EventEmitter<number>();

  public state: DocumentUi;
  public unusedAttributes$: Observable<Attribute[]>;

  public initedDocumentKey: string;
  private currentRowsLength: number;

  public constructor(
    private store$: Store<AppState>,
    private i18n: I18n,
    private notificationService: NotificationService
  ) {}

  public ngOnInit() {
    this.initDocumentServiceIfNeeded();
  }

  public ngOnDestroy() {
    if (this.collection && this.documentModel) {
      this.state.destroy();
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    const changed = this.initDocumentServiceIfNeeded();
    if (changed) {
      this.sizeChange.emit(this.state.rows$.getValue().length);
    }
  }

  public onRemove() {
    this.remove.emit();
  }

  public onEdit() {
    this.selectionHelper.focusInputIfNeeded(this.getDocumentKey());
  }

  public onToggleFavorite() {
    if (this.state) {
      this.state.onToggleFavorite();
    }
  }

  public onUpdateRow(index: number, attribute: string, value: string) {
    if (this.state) {
      this.state.onUpdateRow(index, [attribute, value]);
    }
  }

  public addAttrRow() {
    if (this.state) {
      this.state.onAddRow();
    }
  }

  public onRemoveRow(idx: number) {
    if (this.state) {
      this.state.onRemoveRow(idx);
    }
  }

  public getTrackBy(index: number, row: UiRow): string {
    return row.correlationId || row.id;
  }

  private checkRowsLength(length: number) {
    const changed = this.currentRowsLength && this.currentRowsLength !== length;
    this.currentRowsLength = length;

    if (changed) {
      this.sizeChange.emit(length);
    }
  }

  public onParentKeyDown(event: KeyboardEvent) {
    const scrollKeys: string[] = [KeyCode.ArrowUp, KeyCode.ArrowDown];
    if (scrollKeys.includes(event.code)) {
      event.preventDefault();
    }
  }

  public suggestionListId(): string {
    return `${this.perspectiveId}${this.getDocumentKey()}`;
  }

  public getDocumentKey(): string {
    return this.documentModel.correlationId || this.documentModel.id;
  }

  public isDefaultAttribute(attributeId: string): boolean {
    return attributeId && attributeId === getDefaultAttributeId(this.collection);
  }

  private initDocumentServiceIfNeeded(): boolean {
    if (this.collection && this.documentModel && this.initedDocumentKey !== this.getDocumentKey()) {
      this.initedDocumentKey = this.getDocumentKey();
      if (this.state) {
        this.state.destroy();
      }
      this.state = new DocumentUi(
        this.collection,
        this.documentModel,
        this.store$,
        this.i18n,
        this.notificationService
      );

      this.state.length$.subscribe(length => {
        this.checkRowsLength(length);
      });

      this.unusedAttributes$ = this.state.rows$
        .asObservable()
        .pipe(map(rows => this.collection.attributes.filter(attribute => !rows.find(row => row.id === attribute.id))));
      return true;
    }
    return false;
  }
}
