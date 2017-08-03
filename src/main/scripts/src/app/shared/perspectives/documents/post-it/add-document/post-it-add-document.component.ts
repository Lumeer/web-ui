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

import {Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren} from '@angular/core';

import {Collection} from '../../../../../core/dto/collection';
import {isUndefined} from 'util';

@Component({
  selector: 'post-it-add-document',
  templateUrl: './post-it-add-document.component.html',
  styleUrls: ['./post-it-add-document.component.scss'],
  host: {
    '(document:click)': 'click($event.target)'
  }
})
export class PostItAddDocumentComponent {

  @Input()
  public attributes: string[];

  @Input()
  public collection: Collection;

  @Output()
  public showDocument: EventEmitter<any> = new EventEmitter();

  @Output()
  public hideDocument: EventEmitter<any> = new EventEmitter();

  @Output()
  public newAttributePreview: EventEmitter<object> = new EventEmitter();

  @Output()
  public attributePreview: EventEmitter<object> = new EventEmitter();

  @ViewChildren('attributeInput')
  public inputElements: QueryList<ElementRef>;

  @ViewChild('newAttributeInput')
  public newAttributeInputElement: ElementRef;

  private previousNewAttribute: string;

  private edited: boolean;

  constructor(private element: ElementRef) {
  }

  /**
   * @returns {boolean} string is defined and not empty
   */
  private hasText(str: string): boolean {
    return str && str !== '';
  }

  public attributeChange(value: string, attribute: string): void {
    this.documentCheck();
    this.attributePreview.emit({value: value, attribute: attribute});
  }

  public newAttributeChange(value: string): void {
    this.documentCheck();
    this.newAttributePreview.emit({value: value, previousValue: this.previousNewAttribute});
    this.previousNewAttribute = value;
  }

  public documentCheck(): void {
    let attributesAreEmpty = isUndefined(this.inputElements.find(element => this.hasText(element.nativeElement.value)));
    let newAttributeIsEmpty = !this.hasText(this.newAttributeInputElement.nativeElement.value);

    if (attributesAreEmpty && newAttributeIsEmpty) {
      this.hideDocument.emit();
      this.edited = false;
      return;
    }

    if (!this.edited) {
      this.showDocument.emit();
      this.edited = true;
    }
  }

  public click(target: EventTarget): void {
    // click outside component
    if (!this.element.nativeElement.contains(target)) {
      this.inputElements.forEach(element => element.nativeElement.value = '');
      this.newAttributeInputElement.nativeElement.value = '';
      this.edited = false;
    }
  }
}
