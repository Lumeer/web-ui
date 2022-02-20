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

import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {Project} from '../../../../../core/store/projects/project';
import {LoadingState} from '../../../../../core/model/loading-state';
import {AppState} from '../../../../../core/store/app.state';
import {
  selectProjectTemplates,
  selectProjectTemplatesLoadingState,
} from '../../../../../core/store/projects/projects.state';

@Component({
  selector: 'select-project-template',
  templateUrl: './select-project-template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectProjectTemplateComponent implements OnInit {
  @Input()
  public initialTemplateCode: string;

  public templates$: Observable<Project[]>;
  public templatesState$: Observable<LoadingState>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.templates$ = this.store$.pipe(select(selectProjectTemplates));
    this.templatesState$ = this.store$.pipe(select(selectProjectTemplatesLoadingState));
  }
}
