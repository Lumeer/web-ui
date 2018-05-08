/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

import * as colors from './colors';
import {I18n} from "@ngx-translate/i18n-polyfill";

declare let $: any;

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit {

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @Input()
  public color: string;

  @Output()
  public colorChange = new EventEmitter<string>();

  @Output()
  public selectedChange = new EventEmitter<string>();

  public selected: string;

  public greyscaleColors = colors.greyscale;

  public saturatedColors = colors.saturated;

  public colors = colors.palette;

  public id = new Date().valueOf();

  public customColor = false;

  constructor(private i18n: I18n) {
  }

  public ngOnInit(): void {
    this.selected = this.color;
  }

  public preview(previewed?: string) {
    this.colorChange.emit(previewed ? previewed : this.selected);
  }

  public select(selected: string) {
    this.selected = selected;
    this.selectedChange.emit(selected);
    this.colorChange.emit(selected);
  }

  public colorHighlight(color: string): string {
    if (color === this.selected) {
      return this.darken(color, 80);
    }

    if (color === this.color) {
      return this.darken(color, 40);
    }

    return 'transparent';
  }

  public isCustom() {
    return this.greyscaleColors.indexOf(this.selected) < 0 &&
      this.saturatedColors.indexOf(this.selected) < 0 &&
      this.colors.indexOf(this.selected) < 0;
  }

  public darken(color: string, amount: number): string {
    const hexToNumber = (start: number) => parseInt(color.substr(start, 2), 16);
    const subtractAmount = (num: number) => Math.max(0, (num - amount));

    const darkerColors: string = [hexToNumber(1), hexToNumber(3), hexToNumber(5)]
      .map(subtractAmount)
      .join(', ');

    return `rgb(${darkerColors})`;
  }

  public openSpectrum() {
    const __this = this;

    $(`#spectrum-picker-${this.id}`).spectrum({
      color: this.color,
      flat: false,
      showInput: true,
      cancelText: this.i18n({ id: "color-picker.cancelText", value: "Cancel" }),
      chooseText:  this.i18n({ id: "color-picker.chooseText", value: "Choose" }),
      preferredFormat: 'hex',
      containerClassName: 'spectrum-container',
      clickoutFiresChange: true,
      change: function (color) {
        __this.select(color.toHexString());
      },
      move: function (color) {
        __this.preview(color.toHexString());
      }
    });
  }
}
