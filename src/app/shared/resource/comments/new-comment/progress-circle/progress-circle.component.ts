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
import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'progress-circle',
  templateUrl: './progress-circle.component.svg',
  styleUrls: ['./progress-circle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressCircleComponent implements OnInit, OnChanges {
  @Input()
  public radius: number;

  @Input()
  public progress: number;

  @Input()
  public stroke: number;

  public strokeDashOffset: number;

  public normalizedRadius: number;
  public circumference: number;

  public ngOnInit() {
    this.normalizedRadius = this.radius - this.stroke * 2;
    this.circumference = this.normalizedRadius * 2 * Math.PI;
    this.strokeDashOffset = this.getDashOffset();
  }

  private getDashOffset(): number {
    return this.circumference - (this.progress / 100) * this.circumference;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.progress) {
      this.strokeDashOffset = this.getDashOffset();
    }
  }
}
