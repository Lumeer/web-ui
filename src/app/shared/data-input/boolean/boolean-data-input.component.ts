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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {parseBooleanDataValue} from '../../utils/data.utils';

@Component({
  selector: 'boolean-data-input',
  templateUrl: './boolean-data-input.component.html',
  styleUrls: ['./boolean-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooleanDataInputComponent implements AfterViewInit, OnChanges {
  @Input()
  public indeterminate: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<boolean>();

  @Output()
  public save = new EventEmitter<boolean>();

  @Output()
  public onFocus = new EventEmitter<any>();

  @ViewChild('booleanInput')
  public booleanInput: ElementRef<HTMLInputElement>;

  public inputId =
    'boolean-data-input-' +
    Math.random()
      .toString(36)
      .substr(2);

  constructor(private renderer: Renderer2) {}

  public ngAfterViewInit() {
    this.setIntermediate();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.indeterminate && !changes.indeterminate.firstChange) {
      this.setIntermediate();
    }
  }

  private setIntermediate() {
    this.renderer.setProperty(this.booleanInput.nativeElement, 'indeterminate', this.indeterminate);
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent) {
    if (!this.readonly) {
      const value = parseBooleanDataValue(this.value);
      this.save.emit(!value);
    }
  }

  @HostListener('dblclick', ['$event'])
  public onDoubleClick(event: MouseEvent) {
    event.stopPropagation();
  }

  public onDivClick(event: MouseEvent) {
    event.preventDefault();
  }

  public onInputClick(event: MouseEvent) {
    // label click is propagated instead
    event.preventDefault();
    event.stopPropagation();
  }
}
