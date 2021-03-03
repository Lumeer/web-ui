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

import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit} from '@angular/core';
import {Observable, of, timer, combineLatest, BehaviorSubject} from 'rxjs';
import {distinctUntilChanged, map, skipUntil, switchMap, take, tap} from 'rxjs/operators';
import {isNotNullOrUndefined} from '../../utils/common.utils';
import {ModuleLazyLoadingService} from '../../../core/service/module-lazy-loading.service';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectDocumentsLoadingQueries} from '../../../core/store/documents/documents.state';
import {selectLinkInstancesLoadingQueries} from '../../../core/store/link-instances/link-instances.state';
import {
  selectDataResourcesLoadingQueries,
  selectTasksLoadingQueries,
} from '../../../core/store/data-resources/data-resources.state';

const timerInterval = 1000;
const minimumIncrease = 1;
const maximumIncrease = 6;
const maximumWidth = 97;

@Component({
  selector: 'loading-line',
  templateUrl: './loading-line.component.html',
  styleUrls: ['./loading-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingLineComponent implements OnInit, AfterViewInit {
  public width$: Observable<number>;
  public viewInitiated$ = new BehaviorSubject(false);

  public currentWidth: number;

  constructor(private store$: Store<AppState>, private moduleLazyLoadingService: ModuleLazyLoadingService) {}

  public ngOnInit() {
    this.moduleLazyLoadingService.init();
    this.width$ = this.isLoaded$().pipe(
      switchMap(loaded => {
        if (!loaded) {
          return this.createLoadingWidth$();
        } else if (this.isShowingProgress()) {
          return this.createFinishWidth$();
        }
        return of(null);
      }),
      tap(width => (this.currentWidth = width))
    );
  }

  public ngAfterViewInit() {
    this.viewInitiated$.next(true);
  }

  private isLoaded$(): Observable<boolean> {
    return combineLatest([this.lazyLoaded$(), this.dataLoaded$()]).pipe(
      map(loaded => loaded.every(l => l)),
      distinctUntilChanged()
    );
  }

  private lazyLoaded$(): Observable<boolean> {
    return this.moduleLazyLoadingService.observeLazyLoading().pipe(
      skipUntil(this.viewInitiated$),
      map(loading => !loading)
    );
  }

  private dataLoaded$(): Observable<boolean> {
    return combineLatest([
      this.store$.pipe(select(selectDocumentsLoadingQueries)),
      this.store$.pipe(select(selectLinkInstancesLoadingQueries)),
      this.store$.pipe(select(selectDataResourcesLoadingQueries)),
      this.store$.pipe(select(selectTasksLoadingQueries)),
    ]).pipe(map(loadedMatrix => loadedMatrix.every(queries => queries.length === 0)));
  }

  private isShowingProgress(): boolean {
    return isNotNullOrUndefined(this.currentWidth);
  }

  private createFinishWidth$(): Observable<number> {
    return timer(0, timerInterval / 2).pipe(
      map((value, index) => (index === 0 ? 150 : null)),
      take(2)
    );
  }

  private createLoadingWidth$(): Observable<number> {
    return timer(0, timerInterval).pipe(map(() => this.calculateNewWidth()));
  }

  private calculateNewWidth(): number {
    const currentWidth = this.currentWidth || 0;
    return Math.min(currentWidth + randomNumber(), maximumWidth);
  }
}

function randomNumber(): number {
  return minimumIncrease + Math.random() * (maximumIncrease - minimumIncrease);
}
