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

import {Attribute} from '../../../../../core/dto/attribute';
import {AttributePair} from '../document-attribute';
import {isString} from 'util';
import {AttributePropertyInput} from './property-input';
import {asap} from 'rxjs/scheduler/asap';

@Component({
  selector: 'attribute-list',
  templateUrl: './attribute-list.component.html',
  styleUrls: ['./attribute-list.component.scss']
})
export class AttributeListComponent {

  @Input()
  public index: number;

  @Input()
  public attributes: Attribute[];

  @Input()
  public set data(attributePairs: object) {
    let attributes = Object.keys(attributePairs);
    for (let i = 0; i < attributes.length; i++) {
      let attribute = attributes[i];
      let value = isString(attributePairs[attribute]) ? attributePairs[attribute] : JSON.stringify(attributePairs[attribute], undefined, 2);

      this.attributePairs.push({
        attribute: attribute,
        previousAttributeName: attribute,
        value: value
      });
    }
  }

  @Input()
  public editable: boolean;

  @Output()
  public attributePairChangeEvent = new EventEmitter<AttributePair>();

  public attributePairs: AttributePair[] = [];

  public newAttributePair = {} as AttributePair;

  private selectedPropertyInput = {} as AttributePropertyInput;

  public inputId(x: number, y: number) {
    return `Input${this.index}[${x}, ${y}]`;
  }

  public suggsestedAttributes(): string[] {
    return this.attributes
      .sort((attribute1, attribute2) => {
        if (attribute1.count > attribute2.count) {
          return -1;
        }

        if (attribute1.count < attribute2.count) {
          return 1;
        }

        return 0;
      })
      .map(attribute => attribute.name);
  }

  public onInputKey(event: KeyboardEvent): void {
    this.eventMapper.hasOwnProperty(event.key) && this.eventMapper[event.key]();
  }

  private readonly eventMapper = {
    ArrowUp: () => this.selectAdjacentInput(0, -1, true),
    ArrowDown: () => this.selectAdjacentInput(0, 1, true),
    ArrowLeft: () => this.selectAdjacentInput(-1, 0, true),
    ArrowRight: () => this.selectAdjacentInput(1, 0, true),
    Enter: () => this.selectedPropertyInput.inputTableX === 1 ? this.selectAdjacentInput(-1, 1) : this.selectAdjacentInput(1, 0)
  };

  private selectAdjacentInput(xChange: number, yChange: number, checkCursorOnEdge?: boolean) {
    if (checkCursorOnEdge) {
      if (xChange && !this.cursorOnTextEdge(xChange)) {
        return;
      }
    }

    if (xChange || yChange) {
      this.selectInput(this.selectedPropertyInput.inputTableX + xChange, this.selectedPropertyInput.inputTableY + yChange);
    }
  }

  public selectInput(x: number, y: number): void {
    if (!this.outOfBounds(x, y)) {
      this.selectedPropertyInput = {
        id: this.inputId(x, y),
        element: this.getInput(x, y),
        inputTableX: x,
        inputTableY: y,
        propertyName: this.propertyMapper[x]
      };

      this.selectedPropertyInput.element.focus();
    }
  }

  private readonly propertyMapper = {
    0: 'attribute',
    1: 'value'
  };

  private cursorOnTextEdge(xDirection: number): boolean | undefined {
    if (xDirection < 0) {
      return this.selectedPropertyInput.element.selectionStart === 0;
    }

    if (xDirection > 0) {
      return this.selectedPropertyInput.element.selectionEnd === this.selectedPropertyInput.element.value.length;
    }

    return undefined;
  }

  private outOfBounds(x: number, y: number): boolean {
    if (x < 0 || x > 1) {
      return true;
    }
    if (y < 0 || y > this.attributePairs.length) {
      return true;
    }

    return false;
  }

  private getInput(x: number, y: number): HTMLInputElement {
    let elementId = this.inputId(x, y);
    return document.getElementById(elementId) as HTMLInputElement;
  }

  public attributePairChange(attributePair: AttributePair, newPropertyValue: string): void {
    if (this.selectedPropertyInput.propertyName === 'attribute') {
      attributePair.previousAttributeName = attributePair.attribute;
      !newPropertyValue && this.attributePairs.splice(this.selectedPropertyInput.inputTableY, 1);
    }
    attributePair[this.selectedPropertyInput.propertyName] = newPropertyValue;

    this.attributePairChangeEvent.emit(attributePair);
  }

  public createAttributePair(newPairValue: string): void {
    this.newAttributePair.value = newPairValue;
    this.attributePairs.push(this.newAttributePair);
    this.attributePairChangeEvent.emit(this.newAttributePair);

    window.setTimeout(() => {
      this.newAttributePair = {} as AttributePair;
      this.selectedPropertyInput.element.value = '';
      this.selectInput(1, this.attributePairs.length - 1);
    });
  }
}
