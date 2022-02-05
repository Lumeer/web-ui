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

import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {DialogType} from '../dialog-type';
import {Project} from '../../../core/store/projects/project';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectProjectTemplatesCount, selectReadableProjectsCount} from '../../../core/store/projects/projects.state';

@Injectable()
export class GettingStartedService {
  private readonly _performingAction$ = new BehaviorSubject(false);
  public readonly performingAction$ = this._performingAction$.pipe(distinctUntilChanged());

  private _performingSecondaryAction$ = new BehaviorSubject(false);
  public readonly performingSecondaryAction$ = this._performingSecondaryAction$.pipe(distinctUntilChanged());

  public readonly button$: Observable<DialogButton>;
  public readonly secondaryButton$: Observable<DialogButton>;
  public readonly closeButton$: Observable<DialogButton>;

  private _stage$ = new BehaviorSubject(GettingStartedStage.Template);
  public stage$ = this._stage$.pipe(distinctUntilChanged());

  // components data

  private _selectedTag$ = new BehaviorSubject<string>(null);
  public selectedTag$ = this._selectedTag$.pipe(distinctUntilChanged());
  private _selectedTemplate$ = new BehaviorSubject<Project>(null);
  public selectedTemplate$ = this._selectedTemplate$.pipe(distinctUntilChanged((a, b) => a?.id === b?.id));

  constructor(private store$: Store<AppState>) {
    this.button$ = this._stage$.pipe(switchMap(stage => this.getButton(stage)));
    this.secondaryButton$ = this._stage$.pipe(switchMap(stage => this.getSecondaryButton(stage)));
    this.closeButton$ = this._stage$.pipe(switchMap(stage => this.getCloseButton(stage)));
  }

  public get selectedTag(): string {
    return this._selectedTag$.value;
  }

  public set selectedTag(value: string) {
    this._selectedTag$.next(value);
  }

  public get selectedTemplate(): Project {
    return this._selectedTemplate$.value;
  }

  public set selectedTemplate(value: Project) {
    this._selectedTemplate$.next(value);
  }

  private getButton(stage: GettingStartedStage): Observable<DialogButton> {
    switch (stage) {
      case GettingStartedStage.Template:
        return of({
          disabled$: this.selectedTemplate$.pipe(map(template => !template?.id)),
          class: DialogType.Primary,
          title: $localize`:@@templates.button.use:Use this template`,
        });
      default:
        return of(null);
    }
  }

  private getSecondaryButton(stage: GettingStartedStage): Observable<DialogButton> {
    switch (stage) {
      case GettingStartedStage.Template:
        return combineLatest([
          this.store$.pipe(select(selectProjectTemplatesCount)),
          this.store$.pipe(select(selectReadableProjectsCount)),
        ]).pipe(
          map(([templatesCount, projectsCount]) => {
            if (templatesCount === 0 || projectsCount > 0) {
              return {
                disabled$: of(false),
                class: DialogType.Primary,
                title: $localize`:@@templates.button.empty:Start with empty project`,
              };
            }
            return null;
          })
        );
      default:
        return of(null);
    }
  }

  private getCloseButton(stage: GettingStartedStage): Observable<DialogButton> {
    switch (stage) {
      case GettingStartedStage.Template:
        return this.store$.pipe(
          select(selectReadableProjectsCount),
          map(projectsCount => {
            if (projectsCount > 0) {
              return {
                disabled$: of(false),
                title: $localize`:@@button.cancel:Cancel`,
              };
            }
            return null;
          })
        );
      default:
        return of(null);
    }
  }

  public onSubmit() {}

  public onSecondarySubmit() {}
}

export enum GettingStartedStage {
  Template = 0,
  ChooseOrganization = 1,
  Invitation = 2,
  ConfirmEmail = 3,
  Video = 4,
}

export interface DialogButton {
  title: string;
  class?: DialogType;
  disabled$?: Observable<boolean>;
}
