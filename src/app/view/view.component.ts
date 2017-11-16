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

import {Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';

import {PerspectiveDirective} from './perspectives/perspective.directive';
import {Query} from '../core/dto/query';
import {Perspective, PERSPECTIVES} from './perspectives/perspective';
import {PerspectiveComponent} from './perspectives/perspective.component';
import {ViewService} from '../core/rest/view.service';
import {View} from '../core/dto/view';
import {NotificationService} from 'app/notifications/notification.service';
import {AppState} from '../core/store/app.state';
import {selectNavigation} from '../core/store/navigation/navigation.state';
import {Workspace} from '../core/store/navigation/workspace.model';

@Component({
  templateUrl: './view.component.html'
})
export class ViewComponent implements OnInit {

  @ViewChild(PerspectiveDirective)
  public perspectiveDirective: PerspectiveDirective;

  public view: View;

  private perspectiveComponent: PerspectiveComponent;

  private workspace: Workspace;

  constructor(private componentFactoryResolver: ComponentFactoryResolver,
              private notificationService: NotificationService,
              private router: Router,
              private store: Store<AppState>,
              private viewService: ViewService) {
  }

  public ngOnInit() {
    this.store.select(selectNavigation).subscribe(navigation => {
      this.workspace = navigation.workspace;

      if (this.workspace.viewCode) {
        this.loadView(this.workspace.viewCode, navigation.perspectiveId);
      } else {
        this.loadQuery(navigation.query, navigation.perspectiveId);
      }
    });
  }

  private loadView(code: string, perspective: string) {
    this.viewService.getView(code).subscribe((view: View) => {
      view.perspective = perspective ? perspective : view.perspective;
      this.view = view;
      this.loadPerspective(view.perspective);
    });
  }

  private loadQuery(query: Query, perspective: string) {
    this.view = {
      name: '',
      query: query,
      perspective: perspective,
      config: {}
    };

    this.loadPerspective(perspective);
  }

  private loadPerspective(perspectiveId: string) {
    const perspective = PERSPECTIVES[perspectiveId] || Perspective.Search;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(perspective.component);

    const viewContainerRef = this.perspectiveDirective.viewContainerRef;
    viewContainerRef.clear();

    const componentRef: ComponentRef<PerspectiveComponent> = viewContainerRef.createComponent(componentFactory);
    this.perspectiveComponent = componentRef.instance;
    this.perspectiveComponent.query = this.view.query ? this.view.query : {};
    this.perspectiveComponent.config = this.view.config ? this.view.config : {};
  }

  public onSave() {
    this.view.config = this.perspectiveComponent.extractConfig();

    if (this.view.code) {
      this.updateView();
    } else {
      this.createView();
    }
  }

  private createView() {
    this.viewService.createView(this.view).subscribe((code: string) => {
      this.router.navigate(['w', this.workspace.organizationCode, this.workspace.projectCode, 'view', code]);
      this.notificationService.success('View has been created');
    });
  }

  private updateView() {
    this.viewService.updateView(this.view.code, this.view).subscribe(() => {
      this.notificationService.success('View has been updated');
    });
  }

}
