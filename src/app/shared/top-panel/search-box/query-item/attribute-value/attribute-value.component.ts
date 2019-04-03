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
import {AbstractControl, FormGroup} from '@angular/forms';

import {AttributeQueryItem} from '../model/attribute.query-item';
import {LinkAttributeQueryItem} from '../model/link-attribute.query-item';
import {BehaviorSubject} from 'rxjs';
import {generateCorrelationId} from '../../../../utils/resource.utils';
import {formatDataValue} from '../../../../utils/data.utils';
import {Constraint, ConstraintType} from '../../../../../core/model/data/constraint';
import {KeyCode} from '../../../../key-code';

@Component({
  selector: 'attribute-value',
  templateUrl: './attribute-value.component.html',
  styleUrls: ['./attribute-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeValueComponent implements OnChanges, OnDestroy {
  @Input()
  public queryItem: AttributeQueryItem | LinkAttributeQueryItem;

  @Input()
  public readonly: boolean;

  @Input()
  public queryItemForm: FormGroup;

  @Output()
  public enter = new EventEmitter();

  @Output()
  public moveLeft = new EventEmitter();

  @Output()
  public change = new EventEmitter();

  public constraintTypeBoolean = ConstraintType.Boolean;
  public editing$ = new BehaviorSubject(false);

  private tempElement: HTMLElement;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.queryItem && this.queryItem) {
      this.recalculateWidth(this.queryItem.conditionValue);
    }
  }

  public ngOnDestroy() {
    if (this.tempElement) {
      document.body.removeChild(this.tempElement);
      this.tempElement = null;
    }
  }

  public get conditionValueControl(): AbstractControl {
    return this.queryItemForm && this.queryItemForm.get('conditionValue');
  }

  public onSave(value: any) {
    this.setValue(value);
    this.recalculateWidth(value);

    if (this.conditionValueControl.valid) {
      this.change.emit();
    }
    this.editing$.next(false);
  }

  public onValueChange(value: any) {
    this.recalculateWidth(value);
  }

  private setValue(value: any) {
    this.conditionValueControl.setValue(value);
    this.queryItem.conditionValue = value;
  }

  public focusInput() {
    this.editing$.next(true);
  }

  private recalculateWidth(value: any) {
    const formattedValue = formatDataValue(value, this.constraint);
    const width = this.getWidthOfInput(formattedValue);
    this.renderer.setStyle(this.elementRef.nativeElement, 'width', `${width}px`);
  }

  private get constraint(): Constraint {
    return this.queryItem && this.queryItem.attribute && this.queryItem.attribute.constraint;
  }

  private getWidthOfInput(value: string) {
    if (!this.tempElement) {
      this.tempElement = this.createTempElement();
      document.body.appendChild(this.tempElement);
    }

    this.tempElement.innerHTML = value;
    return this.tempElement.getBoundingClientRect().width;
  }

  private createTempElement(): HTMLElement {
    const tmp = document.createElement('span');
    tmp.className = 'px-2 tmp-invisible';
    tmp.id = generateCorrelationId();
    return tmp;
  }

  public dataInputKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowLeft:
        this.onLeftArrowKeyDown();
        break;
      case KeyCode.Backspace:
        this.onBackspaceKeyDown();
        break;
      case KeyCode.Escape:
        this.editing$.next(false);
        this.recalculateWidth(this.queryItem.conditionValue);
        break;
      case KeyCode.NumpadEnter:
      case KeyCode.Enter:
        if (this.constraint && this.constraint.type === ConstraintType.Boolean) {
          this.onSave(!this.queryItem.conditionValue);
        } else {
          this.editing$.next(!this.editing$.getValue());
        }
        return;
    }
  }

  private onLeftArrowKeyDown() {
    // TODO
  }

  private onBackspaceKeyDown() {
    // TODO
  }
}
