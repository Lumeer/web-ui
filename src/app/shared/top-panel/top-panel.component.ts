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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {LumeerLogoComponent} from './lumeer-logo/lumeer-logo.component';
import {UserPanelComponent} from './user-panel/user-panel.component';
import {WorkspacePanelComponent} from './workspace-panel/workspace-panel.component';

declare let ResizeObserver: ResizeObserver;

@Component({
  selector: 'top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopPanelComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public mobile: boolean;

  @Input()
  public searchBoxShown: boolean;

  @ViewChild(LumeerLogoComponent, {static: false})
  public logo: LumeerLogoComponent;

  @ViewChild(WorkspacePanelComponent, {static: false})
  public workspacePanel: WorkspacePanelComponent;

  @ViewChild(UserPanelComponent, {static: false})
  public userPanel: UserPanelComponent;

  public readonly lineHeight = 36;

  public controlsShown$ = new BehaviorSubject(true);
  public workspace$: Observable<Workspace>;

  private resizeObserver: ResizeObserver;

  private subscriptions = new Subscription();

  constructor(private element: ElementRef<HTMLElement>, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.workspace$ = this.store$.pipe(select(selectWorkspace));

    this.store$.dispatch(new OrganizationsAction.Get());
    this.store$.dispatch(new OrganizationsAction.GetCodes());

    if (window['ResizeObserver']) {
      this.resizeObserver = new ResizeObserver(entries => this.onSideElementResize(entries));
    } else {
      this.subscriptions.add(this.subscribeToWorkspaceChanges());
    }
  }

  private subscribeToWorkspaceChanges(): Subscription {
    return combineLatest(
      this.store$.pipe(select(selectOrganizationByWorkspace)),
      this.store$.pipe(select(selectProjectByWorkspace))
    ).subscribe(() => {
      setTimeout(() => this.setTopPanelSideWidth(), 100);
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.mobile) {
      this.controlsShown$.next(!this.mobile);
    }
  }

  public ngAfterViewInit() {
    if (this.resizeObserver) {
      this.resizeObserver.observe(this.logo.element.nativeElement);
      this.resizeObserver.observe(this.workspacePanel.element.nativeElement);
      this.resizeObserver.observe(this.userPanel.element.nativeElement);
    } else {
      setTimeout(() => this.setTopPanelLineHeight(), 100);
    }
  }

  public ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.subscriptions.unsubscribe();
  }

  @HostListener('window:resize')
  public onWindowResize() {
    if (!this.resizeObserver) {
      this.setTopPanelSideWidth();
    }
  }

  private onSideElementResize(entries: ResizeObserverEntry[]) {
    this.setTopPanelSideWidth();
  }

  private setTopPanelLineHeight() {
    const element = this.element.nativeElement;
    element.style.setProperty('--top-panel-line-height', `${this.lineHeight}px`);
  }

  private setTopPanelSideWidth() {
    if (this.mobile || !this.logo) {
      return;
    }

    const leftWidth = this.calculateLeftSideWidth();
    const rightWidth = this.calculateRightSideWidth();

    // when resizing from mobile view to the larger one, rightWidth is very wide since search box is on another row
    const correctedRightWidth = rightWidth > 400 ? 0 : rightWidth;

    const width = Math.max(leftWidth, correctedRightWidth);

    document.body.style.setProperty('--top-panel-side-width', `${width}px`);
  }

  private calculateLeftSideWidth(): number {
    const logoWidth = this.logo.element.nativeElement.clientWidth;
    const workspacePanelWidth = this.workspacePanel ? this.workspacePanel.element.nativeElement.clientWidth : 0;
    return logoWidth + 10 + workspacePanelWidth;
  }

  private calculateRightSideWidth(): number {
    return this.userPanel ? this.userPanel.element.nativeElement.clientWidth : 0;
  }

  public onToggleControls() {
    this.controlsShown$.next(!this.controlsShown$.getValue());
  }
}
