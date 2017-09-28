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
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {PerspectiveChoice} from './perspectives/perspective-choice';
import {PerspectiveDirective} from './perspectives/perspective.directive';
import {Query} from '../core/dto/query';
import {Perspective, PERSPECTIVES} from './perspectives/perspective';
import {PerspectiveComponent} from './perspectives/perspective.component';

@Component({
  templateUrl: './view.component.html'
})
export class ViewComponent implements OnInit {

  @ViewChild(PerspectiveDirective)
  public perspectiveDirective: PerspectiveDirective;

  public selectedPerspective: PerspectiveChoice;

  protected loadPerspective(perspective: PerspectiveChoice, query: Query) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(perspective.component);

    const viewContainerRef = this.perspectiveDirective.viewContainerRef;
    viewContainerRef.clear();

    const componentRef: ComponentRef<PerspectiveComponent> = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.query = query ? query : {};
  }

  constructor(private activatedRoute: ActivatedRoute,
              private componentFactoryResolver: ComponentFactoryResolver,
              private router: Router) {
  }

  public ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((queryParams: ParamMap) => {
      const query = JSON.parse(queryParams.get('query'));
      this.selectedPerspective = PERSPECTIVES[queryParams.get('perspective')] || Perspective.Search;
      this.loadPerspective(this.selectedPerspective, query);
    });
  }

  public perspectives(): PerspectiveChoice[] {
    return Object.values(PERSPECTIVES);
  }

}
