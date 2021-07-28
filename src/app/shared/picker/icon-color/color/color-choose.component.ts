/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  Renderer2,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as colors from '../../colors';
import {shadeColor} from '../../../utils/html-modifier';

@Component({
  selector: 'color-choose',
  templateUrl: './color-choose.component.html',
  styleUrls: ['./color-choose.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorChooseComponent implements OnChanges {
  @Input()
  public color: string;

  @Output()
  public selected = new EventEmitter<string>();

  @Output()
  public preview = new EventEmitter<string>();

  public customColor = false;

  public readonly greyscaleColors = colors.greyscale;
  public readonly sepiaColors = colors.sepia;
  public readonly saturatedColors = colors.saturated;
  public readonly colors = colors.palette;

  public readonly okButtonText: string;
  public readonly cancelButtonText: string;

  constructor(private renderer: Renderer2) {
    this.okButtonText = $localize`:@@button.select:Select`;
    this.cancelButtonText = $localize`:@@button.cancel:Cancel`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.customColor = this.isCustom();
  }

  private isCustom() {
    return (
      this.greyscaleColors.indexOf(this.color) < 0 &&
      this.saturatedColors.indexOf(this.color) < 0 &&
      this.colors.indexOf(this.color) < 0
    );
  }

  public onPreview(element: any, colorOption: string) {
    this.preview.emit(colorOption);
    this.setHoverBackground(element, colorOption);
  }

  public unPreview(element: any, colorOption: string) {
    this.preview.emit(null);
    this.resetHoverBackground(element, colorOption);
  }

  private setHoverBackground(element: any, color: string) {
    const shadedColor = color ? shadeColor(color, -0.3) : 'transparent';
    this.renderer.setStyle(element, 'border-color', shadedColor);
  }

  private resetHoverBackground(element: any, color: string) {
    const shadedColor = color === this.color ? shadeColor(color, -0.2) : 'transparent';
    this.renderer.setStyle(element, 'border-color', shadedColor);
  }

  public onSelect(colorOption: string) {
    this.selected.emit(colorOption);
  }

  public onPickerSelect(color: string) {
    this.selected.emit(color);
  }

  public onPickerChange(color: string) {
    this.preview.emit(color);
  }

  public onPickerCancel(color: string) {
    this.preview.emit(null);
  }
}
