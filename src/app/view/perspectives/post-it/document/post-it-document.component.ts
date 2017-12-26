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

import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {isString} from 'util';
import {Collection} from '../../../../core/dto/collection';
import {Permission} from '../../../../core/dto/permission';
import {AppState} from '../../../../core/store/app.state';
import {selectWorkspace} from '../../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../../core/store/navigation/workspace.model';
import {KeyCode} from '../../../../shared/key-code';
import {Role} from '../../../../shared/permissions/role';

import {AttributePair} from '../document-data/attribute-pair';
import {AttributePropertySelection} from '../document-data/attribute-property-selection';
import {Direction} from '../document-data/direction';
import {DocumentModel} from '../document-data/document-model';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent implements OnInit {

  @Input()
  public data: DocumentModel;

  @Input()
  public collection: Collection;

  @Input()
  public attributeSuggestions: string[];

  @Output()
  public removed = new EventEmitter();

  @Output()
  public selectOther = new EventEmitter<AttributePropertySelection>();

  @Output()
  public changes = new EventEmitter();

  @Output()
  public toggleFavorite = new EventEmitter();

  @ViewChild('content')
  public content: ElementRef;

  public attributePairs: AttributePair[] = [];

  public newAttributePair: AttributePair;

  private workspace: Workspace;

  constructor(public element: ElementRef,
              private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);

    this.initializeVariables();
    this.setEventListener();
    this.loadDocumentData();
  }

  private initializeVariables(): void {
    this.newAttributePair = {
      attribute: '',
      value: '',
      previousAttributeName: ''
    };
  }

  private setEventListener(): void {
    this.content.nativeElement.addEventListener('keydown', (key: KeyboardEvent) => {
      [KeyCode.UpArrow, KeyCode.DownArrow].includes(key.keyCode) && key.preventDefault();
    }, false);
  }

  private loadDocumentData(): void {
    delete this.data.document.data['_id']; // TODO remove after _id is no longer sent inside data

    this.attributePairs = Object.entries(this.data.document.data).map(([attribute, value]) => {
      return {
        attribute: attribute,
        previousAttributeName: attribute,
        value: isString(value) ? value : JSON.stringify(value, null, 2)
      };
    });
  }

  public onToggleFavorite() {
    this.toggleFavorite.emit();
  }

  public clickOnAttributePair(column: number, row: number): void {
    this.setEditMode(this.previouslySelected(column, row));
    this.select(column, row);
  }

  private previouslySelected(column: number, row: number): boolean {
    return column === this.data.selectedInput.column &&
      row === this.data.selectedInput.row &&
      this.data.index === this.data.selectedInput.documentIdx;
  }

  public onEditModeEnter(): void {
    if (this.attributeColumn(this.data.selectedInput.column)) {
      if (this.data.selectedInput.row === this.attributePairs.length && !this.newAttributePair.attribute) {
        this.moveSelection(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);
      } else {
        this.moveSelection(1, 0);
      }
    } else {
      if (this.data.selectedInput.row === this.attributePairs.length) {
        this.moveSelection(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);
      } else {
        this.moveSelection(-1, 1);
      }
    }
  }

  private moveSelection(columnChange: number, rowChange: number): void {
    const newColumn = this.data.selectedInput.column + columnChange;
    const newRow = this.data.selectedInput.row + rowChange;

    if (this.selectedDocumentDirection(newColumn, newRow) === Direction.Self) {
      this.select(newColumn, newRow);
    } else {
      this.selectOther.emit({
        row: newRow,
        column: newColumn,
        direction: this.selectedDocumentDirection(newColumn, newRow),
        editing: false,
        documentIdx: this.data.index
      });
    }
  }

  private selectedDocumentDirection(newColumn: number, newRow: number): Direction {
    if (newColumn < 0) {
      return Direction.Left;
    }
    if (newColumn > 1 || (this.onDisabledInput(newColumn, newRow) && this.attributeColumn(this.data.selectedInput.column))) {
      return Direction.Right;
    }
    if (newRow < 0) {
      return Direction.Up;
    }
    if (newRow > this.attributePairs.length || (this.onDisabledInput(newColumn, newRow) && this.onSecondToLastRow())) {
      return Direction.Down;
    }

    return Direction.Self;
  }

  private onDisabledInput(column: number, row: number): boolean {
    return !this.newAttributePair.attribute && this.valueColumn(column) && row === this.attributePairs.length;
  }

  private onSecondToLastRow(): boolean {
    return this.data.selectedInput.row === this.attributePairs.length - 1;
  }

  public select(column: number, row: number): void {
    this.data.selectedInput.documentIdx = this.data.index;
    this.selectRow(column, row);
    this.selectColumn(column, row);

    this.focusSelection();
  }

  private selectRow(column: number, row: number): void {
    if (row < this.attributePairs.length) {
      this.data.selectedInput.row = row;
    } else {
      this.data.selectedInput.row = this.attributePairs.length;

      if (this.valueColumn(column) && !this.newAttributePair.attribute) {
        this.data.selectedInput.row--;
      }
    }

    this.data.selectedInput.row = Math.max(0, Math.min(this.attributePairs.length, this.data.selectedInput.row));
  }

  private selectColumn(column: number, row: number): void {
    this.data.selectedInput.column = column;

    if (!this.newAttributePair.attribute && column >= 1 && row === this.attributePairs.length) {
      this.data.selectedInput.column = 0;
    }

    this.data.selectedInput.column = Math.max(0, Math.min(this.data.selectedInput.column, 1));
  }

  private focusSelection(): void {
    if (this.data.selectedInput.column == null || this.data.selectedInput.row == null) {
      return;
    }

    let elementToFocus = document.getElementById(this.selectedInputId());

    if (this.data.selectedInput.editing) {
      elementToFocus = elementToFocus.getElementsByTagName('Input').item(0) as HTMLInputElement;
    }

    elementToFocus.focus();
  }

  private selectedInputId(): string {
    return `AttributePair${ this.data.index }[${ this.data.selectedInput.column }, ${ this.data.selectedInput.row }]`;
  }

  private setEditMode(on: boolean): void {
    this.data.selectedInput.editing = on;
  }

  public updateAttribute(attributePair: AttributePair): void {
    delete this.data.document.data[attributePair.previousAttributeName];
    attributePair.previousAttributeName = attributePair.attribute;

    if (attributePair.attribute) {
      this.data.document.data[attributePair.attribute] = attributePair.value;
    } else {
      this.attributePairs.splice(this.data.selectedInput.row, 1);
    }

    this.changes.emit();
  }

  public updateValue(attributePair: AttributePair): void {
    this.data.document.data[attributePair.attribute] = attributePair.value;
    this.changes.emit();
  }

  public createAttributePair(): void {
    this.newAttributePair.value = '';
    this.attributePairs.push(this.newAttributePair);
    this.changes.emit();

    this.newAttributePair = {} as AttributePair;
    document.activeElement['value'] = '';

    setTimeout(() => this.select(1, this.attributePairs.length - 1));
  }

  private attributeColumn(column: number): boolean {
    return column === 0;
  }

  private valueColumn(column: number): boolean {
    return column === 1;
  }

  public onRemoveDocumentClick(): void {
    this.removed.emit();
  }

  public hasWriteRole(): boolean {
    return this.hasRole(Role.Write);
  }

  private hasRole(role: string): boolean {
    return this.collection.permissions && this.collection.permissions.users
      .some((permission: Permission) => permission.roles.includes(role));
  }

  public configPrefix(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}/f/${this.collection.code}/r/${this.data.document.id}`;
  }

}
