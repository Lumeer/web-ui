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

import {ComponentFactoryResolver, ComponentRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {PerspectiveDirective} from './perspective.directive';
import {Perspective} from './perspective';
import {PerspectiveChoice} from './perspective-choice';
import {Query} from '../../core/dto/query';

export abstract class PerspectivePresenter implements OnInit {

  @ViewChild(PerspectiveDirective)
  public perspectiveDirective: PerspectiveDirective;

  public selectedPerspective: PerspectiveChoice;

  protected constructor(protected activatedRoute: ActivatedRoute,
                        private componentFactoryResolver: ComponentFactoryResolver) {
  }

  public abstract ngOnInit();

  public abstract perspectives(): PerspectiveChoice[];

  protected loadPerspective(perspective: PerspectiveChoice, query: Query) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(perspective.component);

    const viewContainerRef = this.perspectiveDirective.viewContainerRef;
    viewContainerRef.clear();

    const componentRef: ComponentRef<Perspective> = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.query = query ? query : {};
  }

}
