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
import {Query} from '../../../../core/dto/query';
import {SearchAllComponent} from './all/search-all.component';
import {SearchCollectionsComponent} from './collections/search-collections.component';
import {SearchDocumentsComponent} from './documents/search-documents.component';
import {SearchResultsDirective} from './search-results.directive';
import {QueryConverter} from '../../../../shared/utils/query-converter';
import {WorkspaceService} from '../../../../core/workspace.service';
import {SearchLinksComponent} from './links/search-links.component';
import {SearchViewsComponent} from './views/search-views.component';

const COMPONENTS = {
  ['all']: SearchAllComponent,
  ['collections']: SearchCollectionsComponent,
  ['documents']: SearchDocumentsComponent,
  ['links']: SearchLinksComponent,
  ['views']: SearchViewsComponent
};

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent {

  @ViewChild(SearchResultsDirective)
  public searchResultsDirective: SearchResultsDirective;

  public query: string;

  constructor(private activatedRoute: ActivatedRoute,
              private componentFactoryResolver: ComponentFactoryResolver,
              private workspaceService: WorkspaceService) {
  }

  public ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((queryParams: ParamMap) => {
      this.query = queryParams.get('query');
      const query = QueryConverter.fromString(this.query);
      const searchTab = queryParams.get('searchTab');
      this.loadSearchResults(searchTab, query);
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

}
