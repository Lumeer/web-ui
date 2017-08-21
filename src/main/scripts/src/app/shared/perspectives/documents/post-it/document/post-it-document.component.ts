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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {Collection} from '../../../../../core/dto/collection';
import {Document} from '../../../../../core/dto/document';
import {Attribute} from '../../../../../core/dto/attribute';
import {AttributePair} from '../attribute/attribute-pair';
import {AttributePropertyInput} from '../attribute/attribute-property-input';
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

  @Input()
  public selectedInput: AttributePropertyInput;

  @Output()
  public removed = new EventEmitter();

  @Output()
  public attributePairChange = new EventEmitter<AttributePair>();

  public attributePairs: AttributePair[];

  public newAttributePair: AttributePair;

  public ngOnInit(): void {
    this.initializeVariables();
    this.readDocumentData();
  }

  private initializeVariables() {
    this.attributePairs = [];

    this.newAttributePair = {
      attribute: '',
      value: '',
      previousAttributeName: ''
    };
  }

  private readDocumentData(): void {
    Object.keys(this.document.data).forEach(attribute => {
      let value = this.document.data[attribute];
      !isString(value) && (value = JSON.stringify(value, undefined, 2));

      this.attributePairs.push({
        attribute: attribute,
        previousAttributeName: '',
        value: value
      });
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

  private readonly propertyMapper = {
    0: 'attribute',
    1: 'value'
  };

  private readonly eventMapper = {
    ArrowUp: () => this.selectAdjacentInput(0, -1),
    ArrowDown: () => this.selectAdjacentInput(0, 1),
    ArrowLeft: () => this.selectAdjacentInput(-1, 0, true),
    ArrowRight: () => this.selectAdjacentInput(1, 0, true),
    Enter: () => this.selectedInput.column === 1 ? this.selectAdjacentInput(-1, 1) : this.selectAdjacentInput(1, 0)
  };

  private readonly selectionMapper = {
    current: (x, y) => this.selectInput(x, y),
    left: (x, y) => this.selectInput(1, y, this.index - 1),
    right: (x, y) => this.selectInput(0, y, this.index + 1)
  };

  public inputId(x: number, y: number, index?: number) {
    return `Input${index ? index : this.index}[${x}, ${y}]`;
  }

  public suggestedAttributes(): string[] {
    return this.attributes
      .map(attribute => attribute.name)
      .filter(attributeName => !this.usedAttributeName(attributeName));
  }

  private usedAttributeName(attributeName: string): boolean {
    return this.attributePairs
      .map(attributePair => attributePair.attribute)
      .indexOf(attributeName) !== -1;
  }

  public onInputKey(event: KeyboardEvent): void {
    this.eventMapper.hasOwnProperty(event.key) && this.eventMapper[event.key]();
  }

  private selectAdjacentInput(xChange: number, yChange: number, checkCursorOnEdge?: boolean): void {
    if (checkCursorOnEdge && !this.cursorOnTextEdge(xChange)) {
      return;
    }

    if (xChange || yChange) {
      let xToSelect = this.selectedInput.column + xChange;
      let yToSelect = this.selectedInput.row + yChange;

      let documentToSelect = this.documentToSelect(xToSelect, yToSelect);
      this.selectionMapper.hasOwnProperty(documentToSelect) && this.selectionMapper[documentToSelect](xToSelect, yToSelect);
    }
  }

  private documentToSelect(x: number, y: number): string {
    if (x < 0) {
      return 'left';
    }
    if (x > 1) {
      return 'right';
    }
    if (y < 0) {
      return 'up';
    }
    if (y > this.attributePairs.length) {
      return 'down';
    }

    return 'current';
  }

  private cursorOnTextEdge(xChange: number): boolean {
    if (xChange < 0) {
      return this.selectedInput.inputElement.selectionStart === 0;
    }

    if (xChange > 0) {
      return this.selectedInput.inputElement.selectionEnd === this.selectedInput.inputElement.value.length;
    }

    return false;
  }

  public selectInput(x: number, y: number, documentIndex?: number): void {
    this.selectedInput.column = x;
    this.selectedInput.row = y;
    this.selectedInput.property = this.propertyMapper[x];
    this.selectedInput.inputElement = this.getInput(x, y, documentIndex);
    this.selectedInput.editing ? this.selectedInput.inputElement.focus() : this.selectedInput.inputElement.parentElement.focus();
  }

  private getInput(x: number, y: number, documentIndex?: number): HTMLInputElement {
    return document.getElementById(this.inputId(x, y, documentIndex)) as HTMLInputElement;
  }

  public updateAttributePair(attributePair: AttributePair, newPropertyValue: string): void {
    if (this.selectedInput.property === 'attribute') {
      attributePair.previousAttributeName = attributePair.attribute;
      !newPropertyValue && this.attributePairs.splice(this.selectedInput.row, 1);
    }
    attributePair[this.selectedInput.property] = newPropertyValue;

    this.attributePairChange.emit(attributePair);
  }

  public createAttributePair(newPairValue: string): void {
    this.newAttributePair.value = newPairValue;
    this.attributePairs.push(this.newAttributePair);
    this.attributePairChange.emit(this.newAttributePair);

    setTimeout(() => {
      this.newAttributePair = {} as AttributePair;
      this.selectedInput.inputElement.value = '';
      this.selectInput(1, this.attributePairs.length - 1);
    });
  }
}
