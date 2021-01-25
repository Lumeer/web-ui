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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {DataInputSaveAction} from '../data-input-save-action';
import {preventEvent} from '../../utils/common.utils';
import {ConstraintType, DataValue} from '@lumeer/data-filters';

@Component({
  selector: 'boolean-data-input',
  templateUrl: './boolean-data-input.component.html',
  styleUrls: ['./boolean-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooleanDataInputComponent implements OnChanges, OnInit, OnDestroy {
  @Input()
  public indeterminate: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: DataValue;

  @Input()
  public label: string;

  @Output()
  public valueChange = new EventEmitter<DataValue>();

  @Output()
  public save = new EventEmitter<{dataValue: DataValue; action: DataInputSaveAction}>();

  @Output()
  public onFocus = new EventEmitter<any>();

  public readonly inputClass = constraintTypeClass(ConstraintType.Boolean);

  public inputId = 'boolean-data-input-' + Math.random().toString(36).substr(2);

  private clickListener: (MouseEvent) => void;

  constructor(private element: ElementRef) {}

  public ngOnInit() {
    this.addClickListener();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly) {
      this.toggleValue(DataInputSaveAction.Direct);
    }
  }

  public ngOnDestroy() {
    this.removeClickListener();
  }

  private addClickListener() {
    this.removeClickListener();

    this.clickListener = event => this.onClick(event);
    this.element.nativeElement.addEventListener('click', this.clickListener);
  }

  private removeClickListener() {
    if (this.clickListener) {
      this.element.nativeElement.removeEventListener('click', this.clickListener);
    }
    this.clickListener = null;
  }

  private onClick(event: MouseEvent) {
    preventEvent(event);
    this.toggleValue();
  }

  private toggleValue(action?: DataInputSaveAction) {
    const dataValue = this.value.copy(!this.value.serialize());
    this.save.emit({dataValue, action});
  }

  public onDivClick(event: MouseEvent) {
    event.preventDefault();
  }

  public onInputClick(event: MouseEvent) {
    // label click is propagated instead
    event.preventDefault();
    event.stopPropagation();
  }

  public onLabelClick(event: MouseEvent) {
    event.preventDefault();
  }
}
