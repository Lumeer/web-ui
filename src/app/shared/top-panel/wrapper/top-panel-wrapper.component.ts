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

import {ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnInit} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {Workspace} from '../../../core/store/navigation/workspace';
import {AppState} from '../../../core/store/app.state';

@Component({
  selector: 'top-panel-wrapper',
  templateUrl: './top-panel-wrapper.component.html',
  styleUrls: ['./top-panel-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopPanelWrapperComponent implements OnInit {
  @Input()
  public searchBoxShown: boolean;

  public mobile$ = new BehaviorSubject(true);

  public workspace$: Observable<Workspace>;

  constructor(private element: ElementRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.detectMobileResolution();
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.detectMobileResolution();
  }

  private detectMobileResolution() {
    this.mobile$.next(window.matchMedia('(max-width: 767.98px)').matches);
  }
}
