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
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  HostListener,
  OnChanges,
  AfterViewInit,
} from '@angular/core';
import {SliderItem} from './slider-item';
import {isNotNullOrUndefined} from '../../utils/common.utils';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'values-slider',
  templateUrl: './values-slider.component.html',
  styleUrls: ['./values-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValuesSliderComponent implements OnChanges, AfterViewInit {
  @Input()
  public items: SliderItem[];

  @Input()
  public selectedId: any;

  @Input()
  public disabled: boolean;

  @Output()
  public itemSelected: EventEmitter<SliderItem> = new EventEmitter();

  @ViewChild('slider', {static: false})
  public slider: ElementRef;

  private trackingMouse: boolean = false;
  private clickedInside: boolean = false;

  public readonly circleSize = 20;

  public circlePosition$ = new BehaviorSubject<number>(null);
  public step$ = new BehaviorSubject<number>(null);

  constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedId || changes.items) {
      this.computeCirclePosition();
    }
  }

  private computeCirclePosition() {
    if (isNotNullOrUndefined(this.step$.value)) {
      const index = this.selectedId
        ? this.items.findIndex(item => item.id === this.selectedId)
        : Math.floor(this.items.length / 2);
      this.circlePosition$.next(this.calculateSliderLeft(index));
    }
  }

  public ngAfterViewInit() {
    setTimeout(() => {
      this.computeStepSize();
      this.computeCirclePosition();
    });
  }

  private computeStepSize() {
    if (this.element?.nativeElement) {
      const width = this.element.nativeElement.offsetWidth;
      const divider = this.items.length - 1;
      if (divider === 0) {
        this.step$.next(width);
      } else {
        this.step$.next((width - this.circleSize) / divider);
      }
    }
  }

  @HostListener('window:resize')
  public onResize() {
    this.computeStepSize();
    this.computeCirclePosition();
  }

  @HostListener('document:mousedown', ['$event'])
  public onMouseDown(event: any) {
    if (!this.disabled && this.clickedInside) {
      this.trackingMouse = true;
      this.calculateNewPosition(event);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  public onMouseMove(event: any) {
    if (!this.disabled && this.trackingMouse) {
      this.calculateNewPosition(event);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  public onMouseUp(event: any) {
    if (!this.disabled) {
      if (this.trackingMouse) {
        this.trackingMouse = false;
        this.calculateNewPosition(event);
      }
      this.clickedInside = false;
    }
  }

  public onMouseDownInsideComponent() {
    if (!this.disabled) {
      this.clickedInside = true;
    }
  }

  private calculateNewPosition(event: any) {
    const step = this.step$.value;
    if (!step) {
      return;
    }
    const position = event.clientX - this.offsetLeft() - step / 2 - this.circleSize / 2;
    const computedIndex = Math.floor(position / step) + 1;
    const index = Math.min(Math.max(0, computedIndex), this.items.length - 1);
    const newCirclePosition = this.calculateSliderLeft(index);
    if (newCirclePosition !== this.circlePosition$.value) {
      this.circlePosition$.next(newCirclePosition);
      this.itemSelected.emit(this.items[index]);
    }
  }

  private calculateSliderLeft(index: number): number {
    return index * this.step$.value;
  }

  private offsetLeft(): number {
    let offset = this.slider.nativeElement.offsetLeft;
    let parent = this.slider.nativeElement.offsetParent;
    while (parent) {
      offset += parent.offsetLeft;
      parent = parent.offsetParent;
    }

    return offset;
  }
}
