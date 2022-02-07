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

import {Component, ChangeDetectionStrategy, OnInit, AfterViewInit, ElementRef, HostListener} from '@angular/core';
import {GettingStartedService} from '../getting-started.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'getting-started-progress',
  templateUrl: './getting-started-progress.component.html',
  styleUrls: ['./getting-started-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block w-100 p-3'},
})
export class GettingStartedProgressComponent implements OnInit, AfterViewInit {
  public width$: Observable<number>;

  public elementWidth$ = new BehaviorSubject(0);

  constructor(public service: GettingStartedService, public element: ElementRef) {}

  public ngOnInit() {
    this.width$ = this.service.stage$.pipe(
      tap(() => this.checkNewSizeAfterDelay()),
      switchMap(stage =>
        this.elementWidth$.pipe(
          map(width => {
            const maxStages = 5;
            return width * ((stage + 1) / maxStages);
          })
        )
      )
    );
  }

  public ngAfterViewInit() {
    this.checkNewSizeAfterDelay();
  }

  private checkNewSizeAfterDelay() {
    setTimeout(() => this.checkNewSize());
  }

  private checkNewSize() {
    this.elementWidth$.next(this.element.nativeElement.offsetWidth);
  }

  @HostListener('window:resize')
  public onResize() {
    this.checkNewSize();
  }
}
