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

  public config: any;

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
