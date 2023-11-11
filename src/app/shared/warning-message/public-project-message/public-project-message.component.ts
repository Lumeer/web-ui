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

import {Component, ChangeDetectionStrategy, ElementRef, AfterViewInit, OnDestroy} from '@angular/core';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectProjectByWorkspace} from '../../../core/store/projects/projects.state';
import {take} from 'rxjs/operators';
import {ProjectsAction} from '../../../core/store/projects/projects.action';

@Component({
  selector: 'public-project-message',
  templateUrl: './public-project-message.component.html',
  styleUrls: ['./public-project-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block'},
})
export class PublicProjectMessageComponent implements AfterViewInit, OnDestroy {
  constructor(
    private element: ElementRef,
    private store$: Store<AppState>
  ) {}

  public ngAfterViewInit() {
    this.setAuthCallbackOffsetTop();
  }

  private setAuthCallbackOffsetTop() {
    const element = this.element.nativeElement as HTMLElement;
    document.body.style.setProperty('--browser-warning-height', `${element.offsetHeight + 1}px`);
  }

  public ngOnDestroy() {
    document.body.style.removeProperty('--browser-warning-height');
  }

  public onDismiss() {
    this.store$
      .pipe(select(selectProjectByWorkspace), take(1))
      .subscribe(project => this.store$.dispatch(new ProjectsAction.DismissWarningMessage({projectId: project.id})));
  }
}
