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
  Output,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import {Constraint} from '../../core/model/constraint';
import {DataValue} from '../../core/model/data-value';
import {ConstraintType} from '../../core/model/data/constraint';
import {generateCorrelationId} from '../utils/resource.utils';
import {DataCursor} from './data-cursor';
import {DataSuggestion} from './data-suggestion';
import {DataInputConfiguration} from './data-input-configuration';
import {isNotNullOrUndefined} from '../utils/common.utils';

@Component({
  selector: 'data-input',
  templateUrl: './data-input.component.html',
  styleUrls: ['./data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataInputComponent implements OnChanges, OnDestroy {
  @Input()
  public constraint: Constraint;

  @Input()
  public cursor: DataCursor;

  @Input()
  public dataValue: DataValue;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public configuration: DataInputConfiguration = {skipValidation: false, fromQuery: false, resizeToContent: false};

  @Input()
  public placeholder: string;

  @Input()
  public suggestions: DataSuggestion[];

  @Output()
  public valueChange = new EventEmitter<DataValue>();

  @Output()
  public save = new EventEmitter<DataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  private tempElement: HTMLElement;
  public readonly constraintType = ConstraintType;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.dataValue && this.configuration.resizeToContent) {
      this.recalculateWidth(this.dataValue);
    }
  }

  private recalculateWidth(value: DataValue) {
    const width = this.getWidthOfInput(value);
    this.renderer.setStyle(this.elementRef.nativeElement, 'width', isNotNullOrUndefined(width) ? `${width}px` : null);
  }

  private getWidthOfInput(value: DataValue): number | null {
    if (this.computationNotNecessary()) {
      return null;
    }
    if (this.constraint && this.constraint.type === ConstraintType.Boolean) {
      return 16;
    }

    if (!this.tempElement) {
      this.tempElement = this.createTempElement();
      document.body.appendChild(this.tempElement);
    } else {
      this.tempElement.classList.remove('d-none');
    }

    this.tempElement.innerHTML = value.format();
    const textWidth = this.tempElement.getBoundingClientRect().width;

    this.tempElement.classList.add('d-none');

    return textWidth;
  }

  private computationNotNecessary(): boolean {
    const constraintType = this.constraint && this.constraint.type;
    if (!constraintType) {
      return false;
    }
    if ([ConstraintType.Select, ConstraintType.User].includes(constraintType)) {
      return true;
    }

    return false;
  }

  private createTempElement(): HTMLElement {
    const tmp = document.createElement('span');
    tmp.classList.add('px-2', 'invisible', 'white-space-pre');
    tmp.id = generateCorrelationId();
    return tmp;
  }

  public ngOnDestroy() {
    if (this.tempElement) {
      document.body.removeChild(this.tempElement);
      this.tempElement = null;
    }
  }

  public onSaveValue(dataValue: DataValue) {
    if (this.configuration.resizeToContent) {
      this.recalculateWidth(dataValue);
    }
    this.save.emit(dataValue);
  }

  public onValueChange(dataValue: DataValue) {
    if (this.configuration.resizeToContent) {
      this.recalculateWidth(dataValue);
    }
    this.valueChange.emit(dataValue);
  }

  public onCancel() {
    if (this.configuration.resizeToContent) {
      this.recalculateWidth(this.dataValue);
    }
    this.cancel.emit();
  }
}
