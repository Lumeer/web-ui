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

import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {SizeType} from './size-type';

@Component({
  selector: 'size-slider',
  templateUrl: './size-slider.component.html',
  styleUrls: ['./size-slider.component.scss']
})
export class SizeSliderComponent implements OnInit {

  @ViewChild('slider')
  public slider: ElementRef;

  @Input() public defaultSize: SizeType;
  @Output() public newSize: EventEmitter<SizeType> = new EventEmitter();

  public sizes: SizeType[] = [SizeType.S, SizeType.M, SizeType.L, SizeType.XL];
  public componentWidth = 160;
  public circleSize = 15;
  public circlePosition: number = 0;
  public step = this.componentWidth / this.sizes.length;

  public ngOnInit(): void {
    const index = this.defaultSize ? this.sizes.indexOf(this.defaultSize) : Math.floor(this.sizes.length / 2);
    this.circlePosition = this.calculateSliderLeft(index);
  }

  public onSliderClick(event) {
    const position = event.clientX - this.offsetLeft();
    const index = Math.floor(position / this.step);
    const newCirclePosition = this.calculateSliderLeft(index);
    if (newCirclePosition !== this.circlePosition) {
      this.circlePosition = newCirclePosition;
      this.newSize.emit(this.sizes[index]);
    }
  }

  private calculateSliderLeft(index: number) {
    const middleStart = this.step / 2 - this.circleSize / 2;
    return middleStart + index * this.step;
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
