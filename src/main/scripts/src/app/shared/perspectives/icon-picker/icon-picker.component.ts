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

import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LocalService} from '../../../core/local.service';

@Component({
  selector: 'icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss'],
  animations: [
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(100, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(100, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class IconPickerComponent implements OnInit, OnDestroy {

  @Output()
  private colorChange: EventEmitter<string> = new EventEmitter();

  @Input('color')
  public activeColor: string;

  public selectedColor: string;

  public previewColor(newColor: string): void {
    this.activeColor = newColor;
    newColor ? this.colorChange.emit(newColor) : this.colorChange.emit(this.selectedColor);
  }

  public selectColor(newColor: string): void {
    this.selectedColor = newColor;
    this.colorChange.emit(newColor);

    this.change.emit(`selected ${newColor}`);
  }

  //=====================================================================

  @Output()
  private iconChange: EventEmitter<string> = new EventEmitter();

  @Input('icon')
  public activeIcon: string;

  public selectedIcon: string;

  public previewIcon(newIcon: string): void {
    this.activeIcon = newIcon;
    newIcon ? this.iconChange.emit(newIcon) : this.iconChange.emit(this.selectedIcon);
  }

  public selectIcon(newIcon: string): void {
    this.selectedIcon = newIcon;
    this.iconChange.emit(newIcon);

    this.change.emit(`selected ${newIcon}`);
  }

  //=====================================================================

  @Input()
  public enabled: boolean;

  @Output()
  public change: EventEmitter<string> = new EventEmitter();

  public icons: string[];

  public colors: string[];

  constructor(private localService: LocalService) {
  }

  public ngOnInit(): void {
    if (!this.activeColor) {
      throw new Error('icon-picker: attribute [color] is required.');
    }

    if (!this.activeIcon) {
      throw new Error('icon-picker: attribute [icon] is required.');
    }

    this.selectedColor = this.activeColor;
    this.selectedIcon = this.activeIcon;

    this.localService.getSomeIcons()
      .subscribe((icons: string[]) => {
        this.icons = icons;
      });

    this.localService.getColors()
      .subscribe((colors: string[]) => {
        this.colors = colors;
      });
  }

  public colorHighlight(color: string): string {
    if (color === this.selectedColor) {
      return this.darken(color, 80);
    }

    if (color === this.activeColor) {
      return this.darken(color, 40);
    }

    return 'transparent';
  }

  public iconHighlight(icon: string): string {
    if (icon === this.selectedIcon) {
      return 'selected';
    }

    if (icon === this.activeIcon) {
      return 'active';
    }

    return '';
  }

  public darken(color: string, ammount: number): string {
    let hexToNumber = (start: number) => parseInt(color.substr(start, 2), 16);
    let r: number = hexToNumber(1);

    let g: number = hexToNumber(3);
    let b: number = hexToNumber(5);

    let positive = (num: number) => Math.max(num, 0);
    let subtractAmmount = (num: number) => positive(num - ammount);

    let darkR = subtractAmmount(r);
    let darkG = subtractAmmount(g);
    let darkB = subtractAmmount(b);

    return `rgb(${(darkR)}, ${darkG}, ${darkB})`;
  };

  public ngOnDestroy(): void {
    this.colorChange.emit(this.selectedColor);
    this.iconChange.emit(this.selectedIcon);
  }

}
