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
import {BehaviorSubject, Observable, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {Workspace} from '../../../core/store/navigation/workspace';
import {AppState} from '../../../core/store/app.state';
import {selectPublicProject} from '../../../core/store/projects/projects.state';
import {map, mergeMap, switchMap, take} from 'rxjs/operators';
import {selectPerspective, selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {Perspective} from '../../../view/perspectives/perspective';
import {Router} from '@angular/router';
import {isNotNullOrUndefined} from '../../utils/common.utils';
import {selectPublicShowTopPanel} from '../../../core/store/public-data/public-data.state';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Component({
  selector: 'top-panel-wrapper',
  templateUrl: './top-panel-wrapper.component.html',
  styleUrls: ['./top-panel-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopPanelWrapperComponent implements OnInit {
  @Input()
  public searchBoxShown: boolean;

  public readonly showHelp: boolean;

  public mobile$ = new BehaviorSubject(true);

  public workspace$: Observable<Workspace>;
  public showTopPanel$: Observable<boolean>;
  public showBackArrow$: Observable<boolean>;

  constructor(
    private element: ElementRef,
    private store$: Store<AppState>,
    private router: Router,
    private configurationService: ConfigurationService
  ) {
    this.showHelp = !this.configurationService.getConfiguration().publicView;
  }

  public ngOnInit() {
    this.detectMobileResolution();
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.showTopPanel$ = this.bindShowTopPanel$();
    this.showBackArrow$ = this.bindShowBackArrow$();
  }

  private bindShowTopPanel$(): Observable<boolean> {
    if (this.configurationService.getConfiguration().publicView) {
      return this.store$.pipe(
        select(selectPublicShowTopPanel),
        switchMap(showTopPanel => {
          if (isNotNullOrUndefined(showTopPanel)) {
            return of(showTopPanel);
          }
          return this.store$.pipe(
            select(selectPublicProject),
            map(project => project?.templateMetadata?.showTopPanel)
          );
        })
      );
    }
    return of(true);
  }

  private bindShowBackArrow$(): Observable<boolean> {
    return this.showTopPanel$.pipe(
      mergeMap(showTopPanel => {
        if (showTopPanel) {
          return of(false);
        }
        return this.store$.pipe(
          select(selectPerspective),
          map(perspective => !!perspective && perspective !== Perspective.Search)
        );
      })
    );
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.detectMobileResolution();
  }

  private detectMobileResolution() {
    this.mobile$.next(window.matchMedia('(max-width: 767.98px)').matches);
  }

  public onBack() {
    this.store$.pipe(select(selectWorkspace), take(1)).subscribe(workspace => {
      this.router.navigate(['/', 'w', workspace?.organizationCode, workspace?.projectCode, 'view', Perspective.Search]);
    });
  }
}
