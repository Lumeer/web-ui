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
  public selectDocument = new EventEmitter<{ direction: string, row: number }>();

  public suggestedAttributes: String[];

  public attributePairs: AttributePair[];

  public newAttributePair: AttributePair;

  private selectedRow: number;

  private selectedColumn: number;

  private editingMode: boolean;

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
    if (!this.editingMode) {
      this.keyMapper.hasOwnProperty(event.key) && this.keyMapper[event.key]();
    }
  }

  private readonly keyMapper = {
    ArrowUp: () => this.moveSelection(0, -1),
    ArrowDown: () => this.moveSelection(0, 1),
    ArrowLeft: () => this.moveSelection(-1, 0),
    ArrowRight: () => this.moveSelection(1, 0),
    Enter: () => this.selectedColumn === 1 ? this.moveSelection(-1, 1) : this.moveSelection(1, 0)
  };

  private moveSelection(columnChange: number, rowChange: number): void {
    let newColumn = this.selectedColumn + columnChange;
    let newRow = this.selectedRow + rowChange;

    console.log(newColumn, newRow);

    if (newColumn < 0) {
      this.selectDocument.emit({direction: 'Left', row: newRow});
      return;
    }
    if (newColumn > 1 || (newColumn === 1 && newRow === this.attributePairs.length)) {
      this.selectDocument.emit({direction: 'Right', row: newRow});
      return;
    }
    if (newRow < 0) {
      this.selectDocument.emit({direction: 'Up', row: Number.MAX_SAFE_INTEGER});
      return;
    }
    if (newRow > this.attributePairs.length || (newRow === this.attributePairs.length && newColumn === 1)) {
      this.selectDocument.emit({direction: 'Down', row: 0});
      return;
    }

    this.select(newColumn, newRow);
  }

  public select(column: number, row: number): void {
    this.editingMode = false;
    this.selectedRow = Math.min(this.attributePairs.length, row);
    this.selectedColumn = this.selectedRow !== this.attributePairs.length ? column : 0;

    this.focusSelection();
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
