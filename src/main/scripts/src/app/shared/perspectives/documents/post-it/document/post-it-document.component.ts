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

import {Component, ElementRef, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {Collection} from '../../../../../core/dto/collection';
import {Document} from '../../../../../core/dto/document';
import {Attribute} from '../../../../../core/dto/attribute';
import {AttributePair} from './attribute-pair';
import {isString} from 'util';

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

  @Output()
  public removed = new EventEmitter();

  @Output()
  public attributePairChange = new EventEmitter<AttributePair>();

  @Output()
  public selectDocument = new EventEmitter<{ direction: string, row: number, column: number }>();

  public suggestedAttributes: String[];

  public attributePairs: AttributePair[];

  public newAttributePair: AttributePair;

  private selectedRow: number;

  private selectedColumn: number;

  private editingMode: boolean;

  private isSelectedDoument: boolean;

  constructor(private element: ElementRef) {
  }

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

    this.editingMode = false;
  }

  private setEventListener(): void {
    // disable scrolling when navigating using keys
    this.element.nativeElement.addEventListener('keydown', (key: KeyboardEvent) => {
      // arrow keys
      [37, 38, 39, 40].includes(key.keyCode) && key.preventDefault();
    }, false);
  }

  private readDocumentData(): void {
    Object.entries(this.document.data).forEach(([attribute, value]) => {
      this.attributePairs.push({
        attribute: attribute,
        previousAttributeName: '',
        value: isString(value) ? value : JSON.stringify(value, undefined, 2)
      });
    });
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
    if (this.editingMode) {
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
    F2: () => this.switchEditMode(),
    Enter: () => this.switchEditMode()
  };

  private readonly editModeOnKey = {
    F2: () => this.switchEditMode(),
    Escape: () => this.switchEditMode(),
    Enter: () => {
      this.selectedColumn === 1 ? this.moveSelection(-1, 1) : this.moveSelection(1, 0);
      this.switchEditMode();
    }
  };

  private moveSelection(columnChange: number, rowChange: number): void {
    let newColumn = this.selectedColumn + columnChange;
    let newRow = this.selectedRow + rowChange;

    let direction = this.selectedDocumentDirection(newColumn, newRow);
    this.isSelectedDoument = !direction;
    if (direction) {
      this.selectDocument.emit({direction: direction, row: newRow, column: newColumn});
    } else {
      this.select(newColumn, newRow);
    }
  }

  private selectedDocumentDirection(newColumn: number, newRow: number): string {
    if (newColumn < 0) {
      return 'Left';
    }
    if (newColumn > 1 || (this.selectedColumn === 0 && newColumn === 1 && newRow === this.attributePairs.length)) {
      return 'Right';
    }
    if (newRow < 0) {
      return 'Up';
    }
    if (newRow > this.attributePairs.length || (newRow === this.attributePairs.length && newColumn === 1)) {
      return 'Down';
    }

    return '';
  }

  public select(column: number, row: number): void {
    if (this.isSelectedDoument && this.alreadySelectedInput(column, row)) {
      this.switchEditMode();
      return;
    }

    this.editingMode = false;
    this.selectRow(row, column === 1);
    this.selectColumn(column, row >= this.attributePairs.length);

    this.focusSelection();
  }

  private alreadySelectedInput(column: number, row: number): boolean {
    return column === this.selectedColumn && row === this.selectedRow;
  }

  private selectRow(row: number, onValueColumn: boolean): void {
    if (row <= this.attributePairs.length) {
      this.selectedRow = row;
    } else {
      this.selectedRow = onValueColumn ? this.attributePairs.length - 1 : this.attributePairs.length;
    }

    this.selectedRow = Math.max(0, Math.min(this.attributePairs.length, this.selectedRow));
  }

  private selectColumn(column: number, onLastRow: boolean): void {
    this.selectedColumn = onLastRow ? 0 : column;
  }

  private switchEditMode(): void {
    this.editingMode = !this.editingMode;
    this.focusSelection();
  }

  private focusSelection(): void {
    let elementToFocus = document.getElementById(`AttributePair${ this.index }[${ this.selectedColumn }, ${ this.selectedRow }]`);

    if (this.editingMode) {
      elementToFocus = elementToFocus.getElementsByTagName('Input').item(0) as HTMLInputElement;
    }

    elementToFocus.focus();
  }

  public updateAttributePair(attributePair: AttributePair, newPropertyValue: string): void {
    if (this.selectedColumn === 0) {
      attributePair.previousAttributeName = attributePair.attribute;
      !newPropertyValue && this.attributePairs.splice(this.selectedRow, 1);

      attributePair.attribute = newPropertyValue;
      this.refreshSuggestions();
    } else {
      attributePair.value = newPropertyValue;
    }

    this.attributePairChange.emit(attributePair);
  }

  public createAttributePair(newPairValue: string): void {
    this.newAttributePair.value = newPairValue;
    this.attributePairs.push(this.newAttributePair);
    this.attributePairChange.emit(this.newAttributePair);

    let selectedInput = document.activeElement as HTMLInputElement;

    setTimeout(() => {
      this.newAttributePair = {} as AttributePair;
      selectedInput.value = '';
      this.select(1, this.attributePairs.length - 1);
    });
  }

  public onRemoveDocumentClick(): void {
    this.removeDocumentConfirm();
  }

  private removeDocumentConfirm(): void {
    window['BootstrapDialog'].show({
      type: 'type-success',
      title: 'Delete Document?',
      message: 'Deleting a document will permanently remove it from this collection.',
      buttons:
        [
          {
            label: 'No, Keep Document',
            action: dialog => dialog.close()
          },
          {
            label: 'Yes, Delete Document',
            cssClass: 'btn-success',
            hotkey: 13, // Enter
            action: dialog => {
              this.removed.emit();
              dialog.close();
            }
          }
        ]
    });
  }

}
