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

import {AfterViewInit, Component, ComponentFactoryResolver, OnInit, Type, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {PerspectiveDirective} from '../../shared/perspectives/perspective.directive';
import {Perspective} from '../../shared/perspectives/perspective';
import {DocumentsPerspective} from '../../shared/perspectives/documents/documents-perspective';

@Component({
  selector: 'documents-search',
  templateUrl: './documents-search.component.html'
})
export class DocumentsSearchComponent implements OnInit, AfterViewInit {

  @ViewChild(PerspectiveDirective)
  private perspectiveDirective: PerspectiveDirective;

  private perspective: DocumentsPerspective = DocumentsPerspective.defaultPerspective;
  private query: string;

  constructor(private componentFactoryResolver: ComponentFactoryResolver,
              private route: ActivatedRoute) {
  }

  public ngOnInit() {
    this.route.queryParamMap.subscribe((queryParams: ParamMap) => {
      this.perspective = DocumentsPerspective.getPerspective(queryParams.get('perspective'));
      this.query = queryParams.get('query');
    });
  }

  public ngAfterViewInit() {
    this.loadPerspective();
  }

  private loadPerspective() {
    let perspectiveComponent: Type<any> = this.perspective.component;
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(perspectiveComponent);

    let viewContainerRef = this.perspectiveDirective.viewContainerRef;
    viewContainerRef.clear();

    let componentRef = viewContainerRef.createComponent(componentFactory);
    (<Perspective>componentRef.instance).query = this.query;
  }

}
