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
import {ActivatedRoute} from '@angular/router';
import {PerspectiveChoice} from './perspectives/perspective-choice';
import {PerspectiveDirective} from './perspectives/perspective.directive';
import {Query} from '../core/dto/query';
import {Perspective, PERSPECTIVES} from './perspectives/perspective';
import {PerspectiveComponent} from './perspectives/perspective.component';
import {Observable} from 'rxjs/Observable';
import {QueryConverter} from '../shared/utils/query-converter';
import {ViewService} from '../core/rest/view.service';
import {View} from '../core/dto/view';

@Component({
  templateUrl: './view.component.html'
})
export class ViewComponent implements OnInit {

  @ViewChild(PerspectiveDirective)
  public perspectiveDirective: PerspectiveDirective;

  public view: View;

  constructor(private activatedRoute: ActivatedRoute,
              private componentFactoryResolver: ComponentFactoryResolver,
              private viewService: ViewService) {
  }

  public ngOnInit() {
    Observable.combineLatest(
      this.activatedRoute.paramMap,
      this.activatedRoute.queryParamMap
    ).subscribe(([params, queryParams]) => {
      const perspective = queryParams.get('perspective');
      if (params.has('viewCode')) {
        const viewCode = params.get('viewCode');
        this.loadView(viewCode, perspective);
      } else {
        const query = QueryConverter.fromString(queryParams.get('query'));
        this.loadQuery(query, perspective);
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
    componentRef.instance.query = this.view.query ? this.view.query : {};
    componentRef.instance.config = this.view.config ? this.view.config : {};
  }

}
