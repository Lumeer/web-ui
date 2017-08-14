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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DocumentAttribute} from '../document-attribute';
import {Attribute} from '../../../../../core/dto/attribute';
import {AttributeInputElement} from './attribute-input-element';

@Component({
  selector: 'attribute-tree',
  templateUrl: './attribute-tree.component.html',
  styleUrls: ['./attribute-tree.component.scss']
})
export class AttributeTreeComponent {

  @Input()
  public index: number;

  @Input()
  public attributes: Attribute[];

  @Input()
  public set data(attributes: object) {
    for (let key of Object.keys(attributes)) {

      let value;
      if (typeof attributes[key] === 'string') {
        value = attributes[key];
      } else {
        value = JSON.stringify(attributes[key], undefined, 2);
      }

      this.attributeInputs.push({
        name: key,
        value: value,
        previousName: value
      });
    }
  }

  @Input()
  public editable: boolean;

  @Output()
  public attributeChangeEvent = new EventEmitter<DocumentAttribute>();

  public attributeInputs = [] as DocumentAttribute[];

  public newAttributeInput = {} as DocumentAttribute;

  private selectedInput = {} as AttributeInputElement;

  public generateId(x: number, y: number) {
    return `Input${this.index}[${x}, ${y}]`;
  }

  public possibleAttributes(): string[] {
    return this.attributes
      .sort((a, b) => a.count > b.count ? -1 : a.count < b.count ? 1 : 0) // sort by frequency
      .map(attribute => attribute.name);
  }

  public onInputKey(event: KeyboardEvent): void {
    this.checkSelectedInputChange(event);
  }

  private checkSelectedInputChange(event: KeyboardEvent) {
    switch(event.key) {
      case 'ArrowUp':
        this.selectAdjacentInput(0, -1, true);
        break;
      case 'ArrowDown':
        this.selectAdjacentInput(0, 1, true);
        break;
      case 'ArrowLeft':
        this.selectAdjacentInput(-1, 0, true);
        break;
      case 'ArrowRight':
        this.selectAdjacentInput(1, 0, true);
        break;
      case 'Enter':
        if (this.selectedInput.x === 1) {
          this.selectAdjacentInput(-1, 1);
        } else {
          this.selectAdjacentInput(1, 0);
        }
    }
  }

  private selectAdjacentInput(xChange: number, yChange: number, checkCursorOnEdge?: boolean) {
    if (checkCursorOnEdge) {
      if (xChange && !this.cursorOnTextEdge(xChange)) {
        return;
      }
    }

    if (xChange || yChange) {
      this.selectInput(this.selectedInput.x + xChange, this.selectedInput.y + yChange);
    }
  }

  public selectInput(x: number, y: number): void {
    if (!this.outOfBounds(x, y)) {
      this.selectedInput.x = x;
      this.selectedInput.y = y;
      this.selectedInput.id = this.generateId(x, y);
      this.selectedInput.element = this.getInput(x, y);

      this.selectedInput.element.focus();
    }
  }

  private cursorOnTextEdge(xDirection: number): boolean | undefined {
    if (xDirection < 0) {
      return this.selectedInput.element.selectionStart === 0;
    }

    if (xDirection > 0) {
      return this.selectedInput.element.selectionEnd === this.selectedInput.element.value.length;
    }

    return undefined;
  }

  private outOfBounds(x: number, y: number): boolean {
    if (x < 0 || x > 1) {
      return true;
    }
    if (y < 0 || y > this.attributeInputs.length) {
      return true;
    }

    return false;
  }

  private getInput(x: number, y: number): HTMLInputElement {
    let elementId = this.generateId(x, y);
    return document.getElementById(elementId) as HTMLInputElement;
  }

  public attributeChange(index: number): void {
    let attribute = this.attributeInputs[index];
    this.attributeChangeEvent.emit(attribute);
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
        this.selectInput(1, this.attributeInputs.length - 1);
      }, 0);

      this.newAttributeInput = {} as DocumentAttribute;
    }
  }
}
