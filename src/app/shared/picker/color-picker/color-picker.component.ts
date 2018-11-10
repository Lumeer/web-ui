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

import {AfterViewInit, Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

import * as colors from './colors';
import {I18n} from '@ngx-translate/i18n-polyfill';

declare let $: any;

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
})
export class ColorPickerComponent implements OnInit, AfterViewInit {
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

  @Input()
  public dropdownId: string;

  public selected: string;

  public greyscaleColors = colors.greyscale;

  public saturatedColors = colors.saturated;

  public colors = colors.palette;

  public id = new Date().valueOf();

  public customColor = false;

  constructor(private i18n: I18n) {}

  public ngOnInit(): void {
    this.resetColor();
  }

  private resetColor(): void {
    this.selected = this.color;
    this.customColor = this.isCustom();
  }

  public preview(previewed?: string) {
    this.colorChange.emit(previewed ? previewed : this.selected);
  }

  public select(selected: string) {
    this.selected = selected;
    this.selectedChange.emit(selected);
    this.colorChange.emit(selected);
    this.customColor = this.isCustom();
  }

  private isCustom() {
    return (
      this.greyscaleColors.indexOf(this.selected) < 0 &&
      this.saturatedColors.indexOf(this.selected) < 0 &&
      this.colors.indexOf(this.selected) < 0
    );
  }

  public openSpectrum() {
    const __this = this;

    $(`#spectrum-picker-${this.id}`).spectrum({
      color: this.color,
      flat: false,
      showInput: true,
      cancelText: this.i18n({id: 'button.cancel', value: 'Cancel'}),
      chooseText: this.i18n({id: 'button.choose', value: 'Choose'}),
      preferredFormat: 'hex',
      containerClassName: 'spectrum-container',
      clickoutFiresChange: true,
      change: function(color) {
        __this.select(color.toHexString());
      },
      move: function(color) {
        __this.preview(color.toHexString());
      },
    });
  }

  public ngAfterViewInit(): void {
    if (this.dropdownId) {
      $(`#${this.dropdownId}`).on('show.bs.dropdown', () => {
        this.resetColor();
      });
    }
  }
}
