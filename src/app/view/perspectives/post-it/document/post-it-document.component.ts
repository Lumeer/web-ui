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
import {isString} from 'util';
import {Permission} from '../../../../core/dto';
import {LumeerError} from '../../../../core/error/lumeer.error';
import {AppState} from '../../../../core/store/app.state';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {KeyCode} from '../../../../shared/key-code';
import {Role} from '../../../../shared/permissions/role';
import {PostItLayout} from '../../../../shared/utils/layout/post-it-layout';
import {AttributePair} from '../document-data/attribute-pair';
import {PostItDocumentModel} from '../document-data/post-it-document-model';
import {NavigationHelper} from '../util/navigation-helper';
import {SelectionHelper} from '../util/selection-helper';
import DeleteConfirm = DocumentsAction.DeleteConfirm;
import Update = DocumentsAction.Update;

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostListener('focusout')
  public onFocusOut(): void {
    if (this.hasNoAttributes()) {
      this.confirmDeletion();
      this.changed = false;
      return;
    }

    if (this.changed) {
      this.checkforDuplicitAttributes();

      this.changed = false;
      this.changes.emit();
    }
  }

  private hasNoAttributes(): boolean {
    return this.attributePairs.length === 0;
  }

  private checkforDuplicitAttributes(): void {
    const attributesCount = Object.keys(this.postItModel.document.data).length;
    const userWrittenAttributesCount = this.attributePairs.length;

    if (attributesCount !== userWrittenAttributesCount) {
      console.warn('You added more values to single attribute, we suggest refreshing');
    }
  }

  private _postItModel: PostItDocumentModel;

  @Input()
  public get postItModel() {
    return this._postItModel;
  }

  public set postItModel(value) {
    if (!value) {
      throw new LumeerError('Invalid internal state');
    }

    this._postItModel = value;
    this.refreshDataAttributePairs();
  }

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

  public attributePairs: AttributePair[] = [];

  public newAttributePair: AttributePair = new AttributePair();

  constructor(private store: Store<AppState>,
              private element: ElementRef) {
  }

  public ngOnInit(): void {
    this.disableScrollOnNavigation();
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

  public ngAfterViewInit(): void {
    this.layoutManager.add(this.element.nativeElement);
  }

  public clickOnAttributePair(column: number, row: number): void {
    const enableEditMode = this.selectionHelper.wasPreviouslySelected(column, row, this.postItModel.document.id);

    this.selectionHelper.setEditMode(enableEditMode);
    this.selectionHelper.select(column, row, this.postItModel);
  }

  public onEnterKeyPressedInEditMode(): void {
    this.selectionHelper.selectNext(this.postItModel);
  }

  public createAttributePair(): void {
    this.postItModel.document.data[this.newAttributePair.attribute] = '';

    this.newAttributePair.value = '';
    this.attributePairs.push(this.newAttributePair);

    this.newAttributePair = {} as AttributePair;
    document.activeElement['value'] = '';

    this.changed = true;

    setTimeout(() => {
      this.selectionHelper.select(1, Number.MAX_SAFE_INTEGER, this.postItModel);
    });
  }

  public updateAttribute(attributePair: AttributePair): void {
    delete this.postItModel.document.data[attributePair.previousAttributeName];
    attributePair.previousAttributeName = attributePair.attribute;

    if (attributePair.attribute) {
      this.postItModel.document.data[attributePair.attribute] = attributePair.value;

    } else {
      this.removeAttributePair();
    }

    this.changed = true;
  }

  public updateValue(attributePair: AttributePair): void {
    if (this.postItModel.document.data[attributePair.attribute] !== attributePair.value) {
      this.changed = true;
    }

    this.postItModel.document.data[attributePair.attribute] = attributePair.value;
  }

  public toggleDocumentFavorite() {
    this.store.dispatch(new Update({document: this.postItModel.document, toggleFavourite: true}));
  }

  public documentPrefix(): string {
    const workspace = this.navigationHelper.workspacePrefix();
    const collection = `f/${this.postItModel.document.collectionCode}`;
    const document = `r/${this.postItModel.document.id}`;

    return `${workspace}/${collection}/${document}`;
  }

  public confirmDeletion(): void {
    if (this.postItModel.initialized) {
      this.store.dispatch(new DeleteConfirm({
        collectionCode: this.postItModel.document.collectionCode,
        documentId: this.postItModel.document.id
      }));

    } else {
      this.removed.emit();
    }
  }

  private removeAttributePair() {
    const selectedRow = this.selectionHelper.selection.row;
    this.attributePairs.splice(selectedRow, 1);

    setTimeout(() => {
      this.selectionHelper.select(
        this.selectionHelper.selection.column,
        this.selectionHelper.selection.row - 1,
        this.postItModel
      );
    });
  }

  private refreshDataAttributePairs(): void {
    if (!this.postItModel.document.data) {
      this.postItModel.document.data = {};
    }

    this.attributePairs = Object.entries(this.postItModel.document.data).map(([attribute, value]) => {
      return {
        attribute: attribute,
        previousAttributeName: attribute,
        value: isString(value) ? value : JSON.stringify(value, null, 2)
      };
    });
  }

  public hasWriteRole(): boolean {
    return this.hasRole(Role.Write);
  }

  private hasRole(role: string): boolean {
    const collection = this.postItModel.document.collection;
    const permissions = collection && collection.permissions || {users: [], groups: []};
    return permissions.users.some((permission: Permission) => permission.roles.includes(role));
  }

  public ngOnDestroy(): void {
    this.layoutManager.remove(this.element.nativeElement);
  }

}
