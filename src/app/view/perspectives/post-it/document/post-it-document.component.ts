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

import {AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';

import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {KeyCode} from '../../../../shared/key-code';
import {Role} from '../../../../core/model/role';
import {PostItLayout} from '../../../../shared/utils/layout/post-it-layout';
import {PostItDocumentModel} from '../document-data/post-it-document-model';
import {NavigationHelper} from '../util/navigation-helper';
import {SelectionHelper} from '../util/selection-helper';
import {AttributeModel} from '../../../../core/store/collections/collection.model';
import DeleteConfirm = DocumentsAction.DeleteConfirm;
import Update = DocumentsAction.Update;
import {isNullOrUndefined} from 'util';
import {DocumentDataModel} from '../../../../core/store/documents/document.model';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostListener('focusout')
  public onFocusOut(): void {
    // if (this.shouldSuggestDeletion()) {
    //   this.confirmDeletion();
    //   this.changed = false;
    //   return;
    // }

    if (this.changed) {
      this.changed = false;
      this.changes.emit();
    }
  }

  @Input()
  public postItModel: PostItDocumentModel;

  @Input()
  public collectionRoles: string[];

  @Input()
  public perspectiveId: string;

  @Input()
  public layoutManager: PostItLayout;

  @Input()
  public navigationHelper: NavigationHelper;

  @Input()
  public selectionHelper: SelectionHelper;

  @Output()
  public removed = new EventEmitter();

  @Output()
  public changes = new EventEmitter();

  @ViewChild('content')
  public content: ElementRef;

  private changed: boolean;
  private newData: DocumentDataModel = {name: '', value: ''};

  constructor(private store: Store<AppState>,
              private element: ElementRef) {
  }

  public ngOnInit(): void {
    this.disableScrollOnNavigation();
  }

  public ngAfterViewInit(): void {
    this.layoutManager.add(this.element.nativeElement);
  }

  private shouldSuggestDeletion(): boolean {
    return this.hasNoAttributes() && this.isInitialized();
  }

  private hasNoAttributes(): boolean {
    return this.postItModel && this.postItModel.document.data && this.postItModel.document.data.length === 0;
  }

  private isInitialized(): boolean {
    return Boolean(this.postItModel && this.postItModel.document.id);
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

  public clickOnAttributePair(column: number, row: number): void {
    this.selectionHelper.setEditMode(false);
    this.selectionHelper.select(column, row, this.postItModel);
  }

  public onEnterKeyPressedInEditMode(): void {
    this.selectionHelper.selectNext(this.postItModel);
  }

  public createAttributePair(): void {
    const selectedAttribute = this.findAttributeByName(this.newData.name);

    if (selectedAttribute) {
      if (this.isAttributeUsed(selectedAttribute.id)) {
        return;
      }

      this.postItModel.document.data.push({...this.newData, attributeId: selectedAttribute.id});
    } else {
      this.postItModel.document.data.push({...this.newData});
    }

    this.newData = {name: '', value: ''};
    this.changed = true;

    setTimeout(() => {
      this.selectionHelper.select(1, Number.MAX_SAFE_INTEGER, this.postItModel);
    });
  }

  public onUpdateAttribute(selectedRow: number): void {
    const data = this.postItModel.document.data[selectedRow];
    if (!data) {
      return;
    }

    this.changed = true;

    data.name = data.name.trim();
    if (!data.name) {
      this.removeAttributePair(this.selectionHelper.selection.row);
      return;
    }

    const selectedAttribute = this.findAttributeByName(data.name);
    if (data.attributeId && selectedAttribute && selectedAttribute.id !== data.attributeId && this.isAttributeUsed(selectedAttribute.id)) {
      const previousAttribute = this.findAttributeById(data.attributeId);
      data.name = previousAttribute.name;
    } else {
      data.attributeId = selectedAttribute && selectedAttribute.id || null;
    }
  }

  public updateValue(selectedRow: number): void {
    const data = this.postItModel.document.data[selectedRow];
    if (!data) {
      return;
    }

    data.value = data.value.trim();
    this.changed = true;
  }

  public toggleDocumentFavorite() {
    this.store.dispatch(new Update({document: this.postItModel.document, toggleFavourite: true}));
  }

  public confirmDeletion(): void {
    if (this.postItModel.initialized) {
      this.store.dispatch(new DeleteConfirm({
        collectionId: this.postItModel.document.collectionId,
        documentId: this.postItModel.document.id
      }));

    } else {
      this.removed.emit();
    }
  }

  public removeAttributePair(selectedRow: number) {
    this.postItModel.document.data.splice(selectedRow, 1);

    setTimeout(() => {
      this.selectionHelper.select(
        this.selectionHelper.selection.column,
        this.selectionHelper.selection.row - 1,
        this.postItModel
      );
    });
  }

  public removeValue(selectedRow: number) {
    this.postItModel.document.data[selectedRow].value = '';
  }

  public unusedAttributes(): AttributeModel[] {
    return this.postItModel.document.collection.attributes.filter(attribute => {
      return isNullOrUndefined(this.postItModel.document.data.find(d => d.attributeId === attribute.id));
    });
  }

  public findAttributeByName(name: string): AttributeModel {
    return this.postItModel.document.collection.attributes.find(attr => attr.name === name);
  }

  public findAttributeById(id: string): AttributeModel {
    return this.postItModel.document.collection.attributes.find(attr => attr.id === id);
  }


  public isAttributeUsed(id: string) {
    return this.postItModel.document.data.findIndex(d => d.attributeId === id) !== -1;
  }

  public suggestionListId(): string {
    return `${ this.perspectiveId }${ this.postItModel.document.id || 'uninitialized' }`;
  }

  public isDefaultAttribute(attributeId: string): boolean {
    return attributeId === this.postItModel.document.collection.defaultAttributeId;
  }

  public hasWriteRole(): boolean {
    return this.collectionRoles && this.collectionRoles.includes(Role.Write)
  }

  public ngOnDestroy(): void {
    this.layoutManager.remove(this.element.nativeElement);
  }

}
