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

import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';

import {Observable} from 'rxjs';
import {KeyCode} from '../../../../shared/key-code';
import {Role} from '../../../../core/model/role';
import {AttributeModel, CollectionModel} from '../../../../core/store/collections/collection.model';
import {getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {DocumentUiService} from '../../../../core/ui/document-ui.service';
import {UiRow} from '../../../../core/ui/ui-row';
import {map} from 'rxjs/operators';
import {SelectionHelper} from '../util/selection-helper';
import {DocumentModel} from '../../../../core/store/documents/document.model';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostItDocumentComponent implements OnInit, OnDestroy, OnChanges {

  @Input() public documentModel: DocumentModel;
  @Input() public index: number;
  @Input() public collection: CollectionModel;
  @Input() public collectionRoles: string[];
  @Input() public perspectiveId: string;
  @Input() public selectionHelper: SelectionHelper;

  @Output() public remove = new EventEmitter();
  @Output() public sizeChange = new EventEmitter();

  @ViewChild('content') public content: ElementRef;

  public rows$: Observable<UiRow[]>;
  public favorite$: Observable<boolean>;
  public unusedAttributes$: Observable<AttributeModel[]>;

  public initedDocumentKey: string;
  public hasWriteRole = false;
  private currentRowsLength: number;

  public constructor(private documentUiService: DocumentUiService) {
  }

  public ngOnInit() {
    this.disableScrollOnNavigation();
    this.initDocumentServiceIfNeeded();

    this.hasWriteRole = this.collectionRoles && this.collectionRoles.includes(Role.Write);
  }

  public ngOnDestroy() {
    if (this.collection && this.documentModel) {
      this.documentUiService.destroy(this.collection, this.documentModel);
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.collection && this.documentModel && this.initedDocumentKey !== this.getDocumentKey()) {
      const changed = this.initDocumentServiceIfNeeded();
      if (changed) {
        this.sizeChange.emit();
      }
    }
  }

  public onRemove() {
    this.remove.emit();
  }

  public onEdit() {
    this.selectionHelper.focusInputIfNeeded(this.getDocumentKey());
  }

  public onToggleFavorite() {
    this.documentUiService.onToggleFavorite(this.collection, this.documentModel);
  }

  public onUpdateRow(index: number, attribute: string, value: string) {
    this.documentUiService.onUpdateRow(this.collection, this.documentModel, index, [attribute, value]);
  }

  public addAttrRow() {
    this.documentUiService.onAddRow(this.collection, this.documentModel);
  }

  public onRemoveRow(idx: number) {
    this.documentUiService.onRemoveRow(this.collection, this.documentModel, idx);
  }

  public getTrackBy(): (index: number, row: UiRow) => string {
    return this.documentUiService.getTrackBy(this.collection, this.documentModel);
  }

  private checkRowsLength(length: number) {
    const changed = this.currentRowsLength && this.currentRowsLength !== length;
    this.currentRowsLength = length;

    if (changed) {
      this.sizeChange.emit();
    }
  }

  private disableScrollOnNavigation(): void {
    const capture = false;
    const scrollKeys = [KeyCode.UpArrow, KeyCode.DownArrow];

    this.content.nativeElement.addEventListener('keydown', (key: KeyboardEvent) => {
      if (scrollKeys.includes(key.keyCode)) {
        key.preventDefault();
      }
    }, capture);
  }

  public suggestionListId(): string {
    return `${ this.perspectiveId }${ this.documentModel.correlationId || this.documentModel.id }`;
  }

  public getDocumentKey(): string {
    return this.documentModel.correlationId || this.documentModel.id;
  }

  public isDefaultAttribute(attributeId: string): boolean {
    return attributeId && attributeId === getDefaultAttributeId(this.collection);
  }

  private initDocumentServiceIfNeeded(): boolean {
    if (this.collection && this.documentModel && !this.documentUiService.isInited(this.collection, this.documentModel)) {
      this.initedDocumentKey = this.getDocumentKey();
      this.documentUiService.init(this.collection, this.documentModel);
      this.rows$ = this.documentUiService.getRows$(this.collection, this.documentModel).asObservable();
      this.favorite$ = this.documentUiService.getFavorite$(this.collection, this.documentModel).asObservable();
      this.unusedAttributes$ = this.rows$.pipe(
        map(rows => this.collection.attributes.filter(attribute =>
          !rows.find(row => row.id === attribute.id))
        ));

      return true;
    }
    return false;
  }
}
