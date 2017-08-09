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

import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {isArray, isNullOrUndefined, isNumber, isObject, isString} from 'util';

@Component({
  selector: 'attribute-tree',
  templateUrl: './attribute-tree.component.html',
  styleUrls: ['./attribute-tree.component.scss'],
  host: {
    '(document:click)': 'onClick($event.target)',
    '(document:keydown)': 'onKeypress($event)'
  }
})
export class AttributeTreeComponent {

  @Input()
  public children: object;

  @Input()
  public editable: boolean;

  @Output()
  public change: EventEmitter<string> = new EventEmitter();

  @Output()
  public newAttribute: EventEmitter<object> = new EventEmitter();

  @ViewChild('newAttributeInput')
  public newAttributeInput: ElementRef;

  private previousNewAttribute = '';

  /**
   * Workaround because pipes were extremely slow
   */
  public keys(object: object): string[] {
    return Object.keys(object);
  }

  public isArray(element: any): boolean {
    return isArray(element);
  }

  /**
   * Element is at the end of attribute-value tree
   */
  public isLeaf(element: any): boolean {
    return isNumber(element) || isString(element);
  }

  public isString(element: any): boolean {
    return isString(element);
  }

  public isNumber(element: any): boolean {
    return isNumber(element);
  }

  public isStringArray(element: object[]): boolean {
    return element.every(this.isString);
  }

  public isObject(element: any): boolean {
    return !isArray(element) && !isString(element);
  }

  public isDefined(element: any): boolean {
    return !isNullOrUndefined(element);
  }

  public event(event: string) {
    this.change.emit(event);
  }

  public newAttributeChange(value: string): void {
    this.newAttribute.emit({value: value, previousValue: this.previousNewAttribute});
    this.previousNewAttribute = value;
  }

  public onClick(target: EventTarget): void {
    if (!this.newAttributeInput.nativeElement.contains(target)) {
      this.onClickOutsideNewAttributeInput();
    }
  }

  private onClickOutsideNewAttributeInput() {
    this.resetNewAttribute();
  }

  private onKeypress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.resetNewAttribute();
    }
  }

  public resetNewAttribute(): void {
    this.newAttributeInput.nativeElement.value = '';
    this.previousNewAttribute = '';
  }

}
