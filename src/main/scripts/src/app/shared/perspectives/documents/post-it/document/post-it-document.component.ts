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

import {Collection} from '../../../../../core/dto/collection';
import {Document} from '../../../../../core/dto/document';
import {Attribute} from '../../../../../core/dto/attribute';
import {AttributePair} from '../attribute/attribute-pair';
import {AttributePropertySelection} from '../attribute/attribute-property-selection';
import {isString, isUndefined} from 'util';
import {Popup} from '../../../utils/popup';
import {Direction} from '../attribute/direction';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent implements OnInit {

  @Input()
  public editable: boolean;

  @Input()
  public index: number;

  @Input()
  public attributes: Attribute[];

  @Input()
  public collection: Collection;

  @Input()
  public document: Document;

  @Input()
  public selection: AttributePropertySelection;

  @Input()
  public previousSelection: AttributePropertySelection;

  @Output()
  public removed = new EventEmitter();

  @Output()
  public selectOther = new EventEmitter<AttributePropertySelection>();

  @Output()
  public changes = new EventEmitter();

  @ViewChild('content')
  public content: ElementRef;

  public attributePairs: AttributePair[];

  public newAttributePair: AttributePair;

  public suggestedAttributes: String[];

  public ngOnInit(): void {
    this.initializeVariables();
    this.setEventListener();
    this.readDocumentData();
    this.refreshSuggestions();
  }

  private initializeVariables(): void {
    this.attributePairs = [];
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

  private readDocumentData(): void {
    this.attributePairs = Object.entries(this.document.data).map(([attribute, value]) => {
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
    return column === this.previousSelection.column && row === this.previousSelection.row && this.previousSelection.documentIdx === this.index;
  }

  private refreshSuggestions(): void {
    this.suggestedAttributes = this.attributes
      .map(attribute => attribute.name)
      .filter(attributeName => !this.usedAttributeName(attributeName));
  }

  private usedAttributeName(attributeName: string): boolean {
    return this.attributePairs.map(pair => pair.attribute).includes(attributeName);
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (this.selection.editing) {
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
      if (this.attributeColumn(this.selection.column)) {
        if (this.selection.row === this.attributePairs.length && !this.newAttributePair.attribute) {
          this.moveSelection(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);
        } else {
          this.moveSelection(1, 0);
        }
      } else {
        if (this.selection.row === this.attributePairs.length) {
          this.moveSelection(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);
        } else {
          this.moveSelection(-1, 1);
        }
      }
    }
  };

  private moveSelection(columnChange: number, rowChange: number): void {
    let newColumn = this.selection.column + columnChange;
    let newRow = this.selection.row + rowChange;

    if (this.selectedDocumentDirection(newColumn, newRow) === Direction.Self) {
      this.select(newColumn, newRow);
    } else {
      this.selectOther.emit({
        row: newRow,
        column: newColumn,
        direction: this.selectedDocumentDirection(newColumn, newRow),
        editing: false,
        documentIdx: this.index
      });
    }
  }

  private selectedDocumentDirection(newColumn: number, newRow: number): Direction {
    if (newColumn < 0) {
      return Direction.Left;
    }
    if (newColumn > 1 || (this.onDisabledInput(newColumn, newRow) && this.attributeColumn(this.selection.column))) {
      return Direction.Right;
    }
    if (newRow < 0) {
      return Direction.Up;
    }
    if (newRow > this.attributePairs.length || (this.onDisabledInput(newColumn, newRow) && this.selection.row === this.attributePairs.length - 1)) {
      return Direction.Down;
    }

    return Direction.Self;
  }

  private onDisabledInput(column: number, row: number): boolean {
    return !this.newAttributePair.attribute && this.valueColumn(column) && row === this.attributePairs.length;
  }

  public select(column: number, row: number): void {
    this.selection.documentIdx = this.index;
    this.selectRow(column, row);
    this.selectColumn(column, row);

    this.focusSelection();
    this.setPreviousSelection();
  }

  private selectRow(column: number, row: number): void {
    if (row < this.attributePairs.length) {
      this.selection.row = row;
    } else {
      this.selection.row = this.valueColumn(column) && !this.newAttributePair.attribute ? this.attributePairs.length - 1 : this.attributePairs.length;
    }

    this.selection.row = Math.max(0, Math.min(this.attributePairs.length, this.selection.row));
  }

  private selectColumn(column: number, row: number): void {
    this.selection.column = !this.newAttributePair.attribute && column >= 1 && row === this.attributePairs.length ? 0 : column;
    this.selection.column = Math.max(0, Math.min(this.selection.column, 1));
  }

  private setPreviousSelection(): void {
    this.previousSelection.editing = this.selection.editing;
    this.previousSelection.direction = this.selection.direction;
    this.previousSelection.row = this.selection.row;
    this.previousSelection.column = this.selection.column;
    this.previousSelection.documentIdx = this.selection.documentIdx;
  }

  private focusSelection(): void {
    if (!isUndefined(this.selection.column) && !isUndefined(this.selection.row)) {
      let elementToFocus = document.getElementById(`AttributePair${ this.index }[${ this.selection.column }, ${ this.selection.row }]`);

      if (this.selection.editing) {
        elementToFocus = elementToFocus.getElementsByTagName('Input').item(0) as HTMLInputElement;
      }

      elementToFocus.focus();
    }
  }

  private setEditMode(on: boolean): void {
    this.selection.editing = on;
  }

  public updateAttribute(attributePair: AttributePair, newAttribute: string): void {
    attributePair.previousAttributeName = attributePair.attribute;
    attributePair.attribute = newAttribute;

    delete this.document.data[attributePair.previousAttributeName];
    this.document.data[newAttribute] = attributePair.value;

    if (!newAttribute) {
      this.attributePairs.splice(this.selection.row, 1);
      delete this.document.data[attributePair.attribute];
    }

    this.changes.emit();
    this.refreshSuggestions();
  }

  public updateValue(attributePair: AttributePair, newValue: string): void {
    attributePair.value = newValue;
    this.document.data[attributePair.attribute] = newValue;

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
