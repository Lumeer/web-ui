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

import {Component, ComponentFactoryResolver, ComponentRef, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {PerspectiveComponent} from '../perspective.component';
import {Query} from '../../../core/dto/query';
import {SearchResultsDirective} from './search-results.directive';
import {WorkspaceService} from '../../../core/workspace.service';
import {QueryConverter} from '../../../shared/utils/query-converter';
import {SearchAllComponent} from './all/search-all.component';
import {SearchViewsComponent} from './views/search-views.component';
import {SearchLinksComponent} from './links/search-links.component';
import {SearchDocumentsComponent} from './documents/search-documents.component';
import {SearchCollectionsComponent} from './collections/search-collections.component';

const COMPONENTS = {
  ['all']: SearchAllComponent,
  ['collections']: SearchCollectionsComponent,
  ['documents']: SearchDocumentsComponent,
  ['links']: SearchLinksComponent,
  ['views']: SearchViewsComponent
};

@Component({
  templateUrl: './search-perspective.component.html'
})
export class SearchPerspectiveComponent implements PerspectiveComponent {

  @ViewChild(SearchResultsDirective)
  public searchResultsDirective: SearchResultsDirective;

  public query: Query = {};

  constructor(private activatedRoute: ActivatedRoute,
              private componentFactoryResolver: ComponentFactoryResolver,
              private workspaceService: WorkspaceService) {
  }

  public ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((queryParams: ParamMap) => {
      this.query = QueryConverter.fromString(queryParams.get('query'));
      const searchTab = queryParams.get('searchTab');
      this.loadSearchResults(searchTab, this.query);
    });
  }

  private loadSearchResults(searchTab: string, query: Query) {
    const component = COMPONENTS[searchTab] || SearchAllComponent;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);

    const viewContainerRef = this.searchResultsDirective.viewContainerRef;
    viewContainerRef.clear();

    const componentRef: ComponentRef<any> = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.query = query ? query : {};
  }

  public viewPath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}/view`;
  }

  public get stringQuery(): string {
    return QueryConverter.toString(this.query);
  }

}
