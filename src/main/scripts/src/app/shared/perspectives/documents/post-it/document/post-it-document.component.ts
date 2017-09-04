/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {AttributePair} from '../document-data/attribute-pair';
import {AttributePropertySelection} from '../document-data/attribute-property-selection';
import {Direction} from '../document-data/direction';
import {Popup} from '../../../utils/popup';
import {DocumentData} from '../document-data/document-data';
import {isString, isUndefined} from 'util';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent implements OnInit {

  @Input()
  public data: DocumentData;

  @Output()
  public removed = new EventEmitter();

  @Output()
  public selectOther = new EventEmitter<AttributePropertySelection>();

  @Output()
  public changes = new EventEmitter();

  @ViewChild('content')
  public content: ElementRef;

  public attributePairs: AttributePair[] = [];

  public newAttributePair: AttributePair;

  public ngOnInit(): void {
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
    // disable scrolling when navigating using keys
    this.content.nativeElement.addEventListener('keydown', (key: KeyboardEvent) => {
      [37, 38, 39, 40].includes(key.keyCode) && key.preventDefault();
    }, false);
  }

  private fetchCollection(): void {
    this.collectionService.getCollection(this.document.collectionCode).subscribe(
      collection => {
        this.collection = collection;
        this.refreshSuggestions();
        this.editable = this.hasWriteRole();
      },
      error => {
        this.notificationService.error('Error', 'Failed fetching document data');
      }
    );
  }

  public hasWriteRole(): boolean {
    return this.hasRole(this.collection, Role.Write);
  }

  private hasRole(collection: Collection, role: string) {
    return collection.permissions && collection.permissions.users
      .some((permission: Permission) => permission.roles.includes(role));
  }

  private loadDocumentData(): void {
    delete this.data.document.data['_id']; // TODO remove after _id is no longer sent inside data

    this.attributePairs = Object.entries(this.data.document.data).map(([attribute, value]) => {
      return {
        attribute: attribute,
        previousAttributeName: '',
        value: isString(value) ? value : JSON.stringify(value, undefined, 2)
      };
    });
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

  public onKeyDown(event: KeyboardEvent): void {
    if (this.data.selectedInput.editing) {
      this.editModeOnKey.hasOwnProperty(event.key) && this.editModeOnKey[event.key]();
    } else {
      this.selectModeOnKey.hasOwnProperty(event.key) && this.selectModeOnKey[event.key]();
    }
  }

  private readonly selectModeOnKey = {
    ArrowUp: () => this.moveSelection(0, -1),
    ArrowDown: () => this.moveSelection(0, 1),
    ArrowLeft: () => this.moveSelection(-1, 0),
    ArrowRight: () => this.moveSelection(1, 0),
    F2: () => {
      this.setEditMode(true);
      this.focusSelection();
    },
    Enter: () => {
      this.setEditMode(true);
      this.focusSelection();
    }
  };

  private readonly editModeOnKey = {
    F2: () => {
      this.setEditMode(false);
      this.focusSelection();
    },
    Escape: () => {
      this.setEditMode(false);
      this.focusSelection();
    },
    Enter: () => {
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
  };

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
    if (isUndefined(this.data.selectedInput.column) || isUndefined(this.data.selectedInput.row)) {
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

  public updateAttribute(attributePair: AttributePair, newAttribute: string): void {
    attributePair.previousAttributeName = attributePair.attribute;
    attributePair.attribute = newAttribute;

    delete this.data.document.data[attributePair.previousAttributeName];
    this.data.document.data[newAttribute] = attributePair.value;

    if (!newAttribute) {
      this.attributePairs.splice(this.data.selectedInput.row, 1);
      delete this.data.document.data[attributePair.attribute];
    }

    this.changes.emit();
  }

  public updateValue(attributePair: AttributePair, newValue: string): void {
    attributePair.value = newValue;
    this.data.document.data[attributePair.attribute] = newValue;

    this.changes.emit();
  }

  public createAttributePair(newPairValue: string): void {
    this.newAttributePair.value = newPairValue;
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
    Popup.confirmDanger('Delete Document', 'Deleting a document will permanently remove it from this collection.',
      'Keep Document', () => null,
      'Delete Document', () => this.removed.emit());
  }

}
