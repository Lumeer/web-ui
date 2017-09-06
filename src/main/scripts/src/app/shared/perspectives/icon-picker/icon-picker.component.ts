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

@Component({
  selector: 'icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss']
})
export class IconPickerComponent {

  @Output()
  private colorChange = new EventEmitter<string>();

  @Input('color')
  public activeColor: string;

  @Output()
  private iconChange = new EventEmitter<string>();

  @Input('icon')
  public activeIcon: string;

  @Output()
  private itemSelected = new EventEmitter<string>();

  constructor(public element: ElementRef) {
  }

  public colorChangeEvent(event: string): void {
    this.colorChange.emit(event);
  }

  public iconChangeEvent(event: string): void {
    this.iconChange.emit(event);
  }

  public selectionEvent(event: string): void {
    this.itemSelected.emit(event);
  }

}
