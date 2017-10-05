/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
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

  public selectedPerspective: PerspectiveChoice;
  public query: Query;
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
        this.loadView(params.get('viewCode'), perspective);
      } else {
        this.query = QueryConverter.fromString(queryParams.get('query'));
        this.loadQuery(this.query, perspective);
      }
    });
  }

  private loadView(code: string, perspective: string) {
    this.viewService.getView(code).subscribe((view: View) => {
      this.view = view;
      this.loadQuery(view.query, perspective ? perspective : view.perspective);
    });
  }

  private loadQuery(query: Query, perspective: string) {
    this.selectedPerspective = PERSPECTIVES[perspective] || Perspective.Search;
    this.loadPerspective(this.selectedPerspective, query);
  }

  private loadPerspective(perspective: PerspectiveChoice, query: Query) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(perspective.component);

    const viewContainerRef = this.perspectiveDirective.viewContainerRef;
    viewContainerRef.clear();

    const componentRef: ComponentRef<PerspectiveComponent> = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.query = query ? query : {};
  }

}
