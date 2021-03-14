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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
})
export class SliderComponent implements OnInit {
  @Input()
  public values: string;

  @Input()
  public defaultValue: number = 0;

  @Output()
  public onSlide = new EventEmitter<{position: number; value: string}>();

  public splitValues: string[];

  public ngOnInit() {
    this.splitValues = this.values.split('|');
    this.onSlide.emit({position: this.defaultValue, value: this.splitValues[this.defaultValue]});
  }

  public onSlideChange($event) {
    this.onSlide.emit({position: +$event.target.value, value: this.splitValues[$event.target.value]});
  }
}
