/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {BehaviorSubject, Observable} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {LumeerLogoComponent} from './lumeer-logo/lumeer-logo.component';
import {WorkspacePanelComponent} from './workspace-panel/workspace-panel.component';

@Component({
  selector: 'top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopPanelComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked {
  @Input()
  public mobile: boolean;

  @Input()
  public searchBoxShown: boolean;

  @ViewChild(LumeerLogoComponent)
  public logo: LumeerLogoComponent;

  @ViewChild(WorkspacePanelComponent)
  public workspacePanel: WorkspacePanelComponent;

  public readonly lineHeight = 48;

  public controlsShown$ = new BehaviorSubject(true);
  public workspace$: Observable<Workspace>;

  constructor(private element: ElementRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.workspace$ = this.store$.select(selectWorkspace);

    this.store$.dispatch(new OrganizationsAction.Get());
    this.store$.dispatch(new OrganizationsAction.GetCodes());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.mobile) {
      this.controlsShown$.next(!this.mobile);
    }
  }

  public ngAfterViewInit() {
    this.setTopPanelLineHeight();
  }

  public ngAfterViewChecked() {
    this.setTopPanelSideWidth();
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.setTopPanelSideWidth();
  }

  private setTopPanelLineHeight() {
    const element = this.element.nativeElement as HTMLElement;
    element.style.setProperty('--top-panel-line-height', `${this.lineHeight}px`);
  }

  private setTopPanelSideWidth() {
    if (this.mobile || !this.logo) {
      return;
    }

    const logoWidth = this.logo.element.nativeElement.clientWidth;
    const workspacePanelWidth = this.workspacePanel ? this.workspacePanel.element.nativeElement.clientWidth : 0;
    const width = logoWidth + 10 + workspacePanelWidth;
    document.body.style.setProperty('--top-panel-side-width', `${width}px`);
  }

  public onToggleControls() {
    this.controlsShown$.next(!this.controlsShown$.getValue());
  }
}
