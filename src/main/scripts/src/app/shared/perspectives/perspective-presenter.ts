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

import {ComponentFactoryResolver, OnInit, Type, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {PerspectiveDirective} from './perspective.directive';
import {Perspective} from './perspective';
import {Query} from '../../core/dto/query';

export abstract class PerspectivePresenter implements OnInit {

  @ViewChild(PerspectiveDirective)
  private perspectiveDirective: PerspectiveDirective;

  protected perspective: string;
  protected query: Query = {};

  protected constructor(protected activatedRoute: ActivatedRoute,
                        private componentFactoryResolver: ComponentFactoryResolver) {
  }

  public ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((queryParams: ParamMap) => {
      this.perspective = queryParams.get('perspective');
    });
    this.loadPerspective();
  }

  public abstract loadPerspective();

  protected loadPerspectiveComponent(perspectiveComponent: Type<any>) {
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(perspectiveComponent);

    let viewContainerRef = this.perspectiveDirective.viewContainerRef;
    viewContainerRef.clear();

    let componentRef = viewContainerRef.createComponent(componentFactory);
    (<Perspective>componentRef.instance).query = this.query;
  }

}
