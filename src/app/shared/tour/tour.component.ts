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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as Driver from 'driver.js';

@Component({
  selector: 'tour',
  templateUrl: './tour.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourComponent implements OnInit {
  private driver: Driver;

  @Input()
  public opacity: number = 0;

  @Input()
  public steps: Driver.Step[] = [];

  @Input()
  public closeButtonText: string;

  @Output()
  public onReset = new EventEmitter();

  @Output()
  public onNext = new EventEmitter();

  @Output()
  public onPrevious = new EventEmitter();

  public ngOnInit() {
    this.driver = new Driver({
      opacity: this.opacity,
      closeBtnText: this.closeButtonText ? this.closeButtonText : $localize`:@@button.dismiss:Dismiss`,
      onReset: () => this.onReset.emit(),
      onNext: () => this.onNext.emit(),
      onPrevious: () => this.onPrevious.emit(),
    });
  }

  public startTour() {
    setTimeout(() => {
      // trick to allow access to all document elements
      this.driver.reset(true);
      this.driver.defineSteps(this.steps);
      this.driver.start();
    }, 500);
  }
}
