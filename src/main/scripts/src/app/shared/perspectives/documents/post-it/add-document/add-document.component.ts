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

import {Component, ElementRef, EventEmitter, Input, Output} from '@angular/core';

import {Collection} from '../../../../../core/dto/collection';
import {Attribute} from '../../../../../core/dto/attribute';
import {DocumentAttribute} from '../document-attribute';

@Component({
  selector: 'add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss'],
  host: {
    '(document:click)': 'onClick($event.target)'
  }
})
export class PostItAddDocumentComponent {

  @Input()
  public attributes: Attribute[];

  @Input()
  public collection: Collection;

  @Output()
  public createDocumentEvent = new EventEmitter();

  @Output()
  public deleteDocumentEvent = new EventEmitter();

  @Output()
  public attributePreview = new EventEmitter<object>();

  public attributeInputs = [] as DocumentAttribute[];

  public newAttributeInput = {} as DocumentAttribute;

  private edited: boolean;

  constructor(private element: ElementRef) {
  }

  public generateId(x: number, y: number) {
    return `Input[${x}, ${y}]`;
  }

  public possibleAttributes(): string[] {
    return this.attributes
      .sort((a, b) => a > b ? 1 : a < b ? -1 : 0)
      .map(attribute => attribute.name)
      .filter(attribute => !this.usedAttribute(attribute));
  }

  private usedAttribute(attribute: string): boolean {
    return this.attributeInputs
      .map(attribute => attribute.name)
      .indexOf(attribute) !== -1;
  }

  public onKeyOnInput(event: KeyboardEvent, x: number, y: number): void {
    let currentElement = this.getElement(x, y);

    switch (event.key) {
      case 'ArrowUp':
        this.focusAttribute(x, y - 1);
        break;
      case 'ArrowDown':
        this.focusAttribute(x, y + 1);
        break;
      case 'ArrowLeft':
        if (currentElement.selectionStart === 0) {
          this.focusAttribute(x - 1, y);
        }
        break;
      case 'ArrowRight':
        if (currentElement.selectionStart === currentElement.value.length) {
          this.focusAttribute(x + 1, y);
        }
        break;
      case 'Enter':
        if (x === 1) {
          this.focusAttribute(0, y + 1);
        } else {
          this.focusAttribute(x + 1, y);
        }
        break;
    }
  }

  public focusAttribute(x: number, y: number): void {
    if (x < 0 || x > 1) {
      return;
    }
    if (y < 0 || y > this.attributeInputs.length) {
      return;
    }

    this.getElement(x, y).focus();
  }

  private getElement(x: number, y: number): HTMLInputElement {
    let elementId = this.generateId(x, y);
    return document.getElementById(elementId) as HTMLInputElement;
  }

  public attributeChange(index: number): void {
    this.documentCheck();

    let attribute = this.attributeInputs[index];
    this.attributePreview.emit(attribute);
    attribute.previousName = attribute.name;

    if (!attribute.name) {
      this.attributeInputs.splice(index, 1);
    }
  }

  public newAttributeValue(key: string): void {
    if (key.length === 1) {
      this.newAttributeInput.value = key;
      this.attributeInputs.push(this.newAttributeInput);

      this.attributeChange(this.attributeInputs.length - 1);
      window.setTimeout(() => {
        this.focusAttribute(1, this.attributeInputs.length - 1);
      }, 0);

      this.newAttributeInput = {} as DocumentAttribute;
    }
  }

  private documentCheck(): void {
    let noDocumentCreated = !this.edited;
    if (noDocumentCreated) {
      this.createNewDocument();
      return;
    }

    let documentEmpty = this.attributeInputs.length === 0 && this.newAttributeInput.name === '';
    if (documentEmpty) {
      this.deleteNewDocument();
    }
  }

  private createNewDocument(): void {
    this.createDocumentEvent.emit();
    this.edited = true;
  }

  private deleteNewDocument(): void {
    this.deleteDocumentEvent.emit();
    this.edited = false;
  }

  public onClick(target: EventTarget): void {
    if (!this.element.nativeElement.contains(target)) {
      this.onClickOutsideComponent();
    }
  }

  private onClickOutsideComponent() {
    this.finalizeDocumentCreation();
  }

  public finalizeDocumentCreation(): void {
    this.attributeInputs = [];
    this.newAttributeInput = {} as DocumentAttribute;
    this.edited = false;
  }

}
