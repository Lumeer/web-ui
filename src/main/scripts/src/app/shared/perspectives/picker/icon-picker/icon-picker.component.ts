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

import * as Const from '../../../const';

@Component({
  selector: 'icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss']
})
export class IconPickerComponent implements OnInit {

  @Input()
  public icon: string;

  @Output()
  private iconChange = new EventEmitter<string>();

  @Output()
  public selectedChange = new EventEmitter<string>();

  public selected: string;

  public icons = Const.icons;

  public tab = 0;

  public ngOnInit(): void {
    this.selected = this.icon;
  }

  public preview(previewed: string) {
    this.iconChange.emit(previewed ? previewed : this.selected);
  }

  public select(selected: string) {
    this.selected = selected;
    this.selectedChange.emit(selected);
    this.iconChange.emit(selected);
  }

  public iconHighlight(icon: string): string {
    if (icon === this.selected) {
      return 'selected';
    }

    if (icon === this.icon) {
      return 'active';
    }

    return '';
  }

  public range(start: number, end: number): number[] {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  }

  public tabIcon(tabIndex: number): string {
    const iconsPerTab = this.icons.length / 8;
    const start = Math.floor(tabIndex * iconsPerTab);
    return this.icons[start];
  }

  public iconsInTab(tabIndex: number): string[] {
    const iconsPerTab = this.icons.length / 8;
    const start = Math.floor(tabIndex * iconsPerTab);
    return this.icons.slice(start, start + iconsPerTab);
  }

}
