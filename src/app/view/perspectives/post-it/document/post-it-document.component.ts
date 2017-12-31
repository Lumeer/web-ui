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
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output,
  ViewChild
} from '@angular/core';
import {Store} from '@ngrx/store';
import {isString} from 'util';
import {Permission} from '../../../../core/dto';
import {AppState} from '../../../../core/store/app.state';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import {KeyCode} from '../../../../shared/key-code';
import {Role} from '../../../../shared/permissions/role';
import {PostItLayout} from '../../../../shared/utils/layout/post-it-layout';
import {NavigationManager} from '../bussiness/navigation-manager';
import {SelectionManager} from '../bussiness/selection-manager';
import {AttributePair} from '../document-data/attribute-pair';
import {PostItDocumentModel} from '../document-data/post-it-document-model';
import ToggleFavourite = DocumentsAction.ToggleFavourite;
import Confirm = NotificationsAction.Confirm;

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent implements OnInit, AfterViewInit, OnDestroy {

  private _postItModel: PostItDocumentModel;

  @Input()
  public get postItModel() {
    return this._postItModel;
  }

  public set postItModel(value) {
    this._postItModel = value;
    this.refreshDataAttributePairs();
  }

  @Input()
  public perspectiveId: string;

  @Input()
  public layoutManager: PostItLayout;

  @Input()
  public navigationManager: NavigationManager;

  @Input()
  public selectionManager: SelectionManager;

  @Output()
  public removed = new EventEmitter();

  @Output()
  public changes = new EventEmitter();

  @ViewChild('content')
  public content: ElementRef;

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

  private refreshDataAttributePairs(): void {
    this.attributePairs = Object.entries(this.postItModel.documentModel.data).map(([attribute, value]) => {
      return {
        attribute: attribute,
        previousAttributeName: attribute,
        value: isString(value) ? value : JSON.stringify(value, null, 2)
      };
    });
  }

  public toggleDocumentFavorite() {
    this.store.dispatch(new ToggleFavourite({document: this.postItModel.documentModel}));
  }

  public clickOnAttributePair(column: number, row: number): void {
    const enableEditMode = this.selectionManager.wasPreviouslySelected(column, row, this.postItModel.documentModel.id);

    this.selectionManager.setEditMode(enableEditMode);
    this.selectionManager.select(column, row, this.postItModel);
  }

  public onEnterKeyPressedInEditMode(): void {
    this.selectionManager.selectNext(this.postItModel);
  }

  public updateAttribute(attributePair: AttributePair): void {
    delete this.postItModel.documentModel.data[attributePair.previousAttributeName];
    attributePair.previousAttributeName = attributePair.attribute;

    if (attributePair.attribute) {
      this.postItModel.documentModel.data[attributePair.attribute] = attributePair.value;

    } else {
      const selectedRow = this.selectionManager.selection.row;
      this.attributePairs.splice(selectedRow, 1);
    }

    this.changes.emit();
  }

  public updateValue(attributePair: AttributePair): void {
    this.postItModel.documentModel.data[attributePair.attribute] = attributePair.value;
    this.changes.emit();
  }

  public createAttributePair(): void {
    this.newAttributePair.value = '';
    this.attributePairs.push(this.newAttributePair);
    this.changes.emit();

    this.newAttributePair = {} as AttributePair;
    document.activeElement['value'] = '';

    setTimeout(() => {
      this.selectionManager.select(1, this.attributePairs.length - 1, this.postItModel);
    });
  }

  public hasWriteRole(): boolean {
    return this.hasRole(Role.Write);
  }

  private hasRole(role: string): boolean {
    const collection = this.postItModel.documentModel.collection;
    return collection.permissions && collection.permissions.users
      .some((permission: Permission) => permission.roles.includes(role));
  }

  public documentPrefix(): string {
    const workspace = this.navigationManager.workspacePrefix();
    const collection = `f/${this.postItModel.documentModel.collectionCode}`;
    const document = `r/${this.postItModel.documentModel.id}`;

    return `${workspace}/${collection}/${document}`;
  }

  public confirmDeletion(): void {
    this.store.dispatch(new Confirm(
      {
        title: 'Delete?',
        message: 'Are you sure you want to remove the document?',
        callback: () => this.removed.emit(this.postItModel)
      }
    ));
  }

  public ngOnDestroy(): void {
    this.layoutManager.remove(this.element.nativeElement);
  }

}
