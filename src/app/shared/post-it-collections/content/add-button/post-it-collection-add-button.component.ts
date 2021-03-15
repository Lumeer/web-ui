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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {BehaviorSubject} from 'rxjs';
import {ProjectsAction} from '../../../../core/store/projects/projects.action';
import {SampleDataType} from '../../../../core/model/sample-data-type';

@Component({
  selector: 'post-it-collection-add-button',
  templateUrl: './post-it-collection-add-button.component.html',
  styleUrls: ['./post-it-collection-add-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItCollectionAddButtonComponent {
  @Input()
  public disabled: boolean;

  @Input()
  public showAddTaskTable: boolean;

  @Output()
  public clicked = new EventEmitter();

  constructor(private store$: Store<AppState>) {}

  public creatingData$ = new BehaviorSubject(false);

  public onCreate() {
    this.creatingData$.next(true);

    const errorMessage = $localize`:@@tasks.sample.data.failure:Could not add task table to project`;
    this.store$.dispatch(
      new ProjectsAction.CreateSampleData({
        type: SampleDataType.Tasks,
        errorMessage,
        onFailure: () => this.creatingData$.next(false),
      })
    );
  }

  public add() {
    this.clicked.emit();
  }
}
