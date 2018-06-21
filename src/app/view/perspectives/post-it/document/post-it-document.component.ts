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

import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';

import {Store} from '@ngrx/store';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../../../core/store/app.state';
import {KeyCode} from '../../../../shared/key-code';
import {Role} from '../../../../core/model/role';
import {PostItDocumentModel} from '../document-data/post-it-document-model';
import {SelectionHelper} from '../util/selection-helper';
import {AttributeModel, CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {PostItRow} from './post-it-row';
import {Subject, Subscription} from 'rxjs';
import {debounceTime, filter} from 'rxjs/operators';
import {CorrelationIdGenerator} from '../../../../core/store/correlation-id.generator';
import {getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {DocumentUiService} from '../../../../core/ui/document-ui.service';
import {Observable} from 'rxjs/index';
import {UiRow} from '../../../../core/ui/ui-row';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostItDocumentComponent implements OnInit, OnDestroy {

  @Input() public postItModel: PostItDocumentModel;
  @Input() public collection: CollectionModel;
  @Input() public collectionRoles: string[];
  @Input() public perspectiveId: string;
  @Input() public selectionHelper: SelectionHelper;

  @Output() public remove = new EventEmitter();
  @Output() public changes = new EventEmitter();

  @ViewChild('content') public content: ElementRef;

  public hasWriteRole = false;

  public constructor(private documentUiService: DocumentUiService) {
  }

  public ngOnInit() {
    this.disableScrollOnNavigation();
    this.initDocumentService();

    this.hasWriteRole = this.collectionRoles && this.collectionRoles.includes(Role.Write);
  }

  public ngOnDestroy() {
    if (this.collection && this.postItModel && this.postItModel.document) {
      this.documentUiService.destroy(this.collection, this.postItModel.document);
    }
  }

  public onRemove() {
    // TODO removing actually creating document?
    this.remove.emit();
  }

  public getRows$(): Observable<UiRow[]> {
    return this.documentUiService.getRows$(this.collection, this.postItModel.document);
  }

  public getFavorite$(): Observable<boolean> {
    return this.documentUiService.getFavorite$(this.collection, this.postItModel.document);
  }

  public onToggleFavorite() {
    this.documentUiService.onToggleFavorite(this.collection, this.postItModel.document);
  }

  public onUpdateRow(index: number, attribute: string, value: string) {
    this.documentUiService.onUpdateRow(this.collection, this.postItModel.document, index, [attribute, value]);
  }

  public addAttrRow() {
    this.documentUiService.onAddRow(this.collection, this.postItModel.document);
  }

  public onRemoveRow(idx: number) {
    this.documentUiService.onRemoveRow(this.collection, this.postItModel.document, idx);
  }

  public getTrackBy(): (index: number, row: UiRow) => string {
    return this.documentUiService.getTrackBy(this.collection, this.postItModel.document);
  }

  private disableScrollOnNavigation(): void {
    /// TODO ????
    const capture = false;
    const scrollKeys = [KeyCode.UpArrow, KeyCode.DownArrow];

    this.content.nativeElement.addEventListener('keydown', (key: KeyboardEvent) => {
      if (scrollKeys.includes(key.keyCode)) {
        key.preventDefault();
      }
    }, capture);
  }

  public clickOnAttributePair(column: number, row: number): void {
    this.selectionHelper.setEditMode(false);
    this.selectionHelper.select(column, row, this.postItModel);
  }

  public onEnterKeyPressedInEditMode(): void {
    this.selectionHelper.selectNext(this.postItModel);
  }

  public onEdit() {
    this.selectionHelper.setEditMode(true);
    this.selectionHelper.select(0, 0, this.postItModel)
  }

  public unusedAttributes(): AttributeModel[] {
    if (isNullOrUndefined(this.collection)) {
      return [];
    }

    return [];
    // return this.collection.attributes.filter(attribute => {
    //   return isNullOrUndefined(this.postItRows.find(d => d.attributeId === attribute.id));
    // });
  }

  public suggestionListId(): string {
    return `${ this.perspectiveId }${ this.postItModel.document.correlationId || this.postItModel.document.id }`;
  }

  public isDefaultAttribute(attributeId: string): boolean {
    return attributeId && attributeId === getDefaultAttributeId(this.collection);
  }

  private initDocumentService() {
    if (this.collection && this.postItModel && this.postItModel.document) {
      this.documentUiService.init(this.collection, this.postItModel.document);
    }
  }
}
