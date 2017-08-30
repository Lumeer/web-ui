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

import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/switchMap';

import {Suggestion} from '../../core/dto/suggestion';
import {SearchService} from '../../core/rest/search.service';
import {WorkspaceService} from '../../core/workspace.service';
import {Suggestions} from '../../core/dto/suggestions';

const BACKSPACE_KEY = 8;
const ENTER_KEY = 13;

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent {

  public queryItems: string[] = [];
  private type = 'All';
  private text = '';

  private searchTerms = new Subject<string>();
  private suggestions: Observable<Suggestions | Suggestion[]>;

  constructor(private router: Router,
              private searchService: SearchService,
              private workspaceService: WorkspaceService) {
  }

  public ngOnInit(): void {
    this.suggestions = this.searchTerms
      .startWith('')
      .debounceTime(300)
      .distinctUntilChanged()
      .switchMap(term => term ? this.searchService.suggest(term, this.type) : Observable.of<Suggestions | Suggestion[]>([]))
      .catch(error => {
        console.error(error); // TODO: add real error handling
        return Observable.of<Suggestions | Suggestion[]>([]);
      });
  }

  public onKeyUp(event: KeyboardEvent) {
    switch (event.keyCode) {
      case ENTER_KEY:
        return;
      case BACKSPACE_KEY:
      default:
        this.suggest();
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case BACKSPACE_KEY:
        this.removeItem();
        return;
      case ENTER_KEY:
        this.addItemOrSearch();
        return;
    }
  }

  private removeItem() {
    if (this.text === '') {
      event.preventDefault();
      this.text = this.queryItems.pop();
    }
  }

  private addItemOrSearch() {
    if (this.text.trim() === '') {
      if (this.queryItems.length > 0) {
        this.search();
      }
    } else {
      this.addQueryItem(this.text);
    }
  }

  public suggest(): void {
    this.searchTerms.next(this.text);
  }

  public hideSuggestions(): void {
    this.searchTerms.next('');
  }

  public complete(suggestion: Suggestion): void {
    this.addQueryItem(suggestion.type + ':' + suggestion.text);
  }

  public onButtonClick() {
    if (this.text.trim() !== '') {
      this.addQueryItem(this.text);
    }
    this.search();
  }

  public search(): void {
    let organization = this.workspaceService.organizationCode;
    let project = this.workspaceService.projectCode;

    this.router.navigate(['/w', organization, project, 'search', 'all'], {queryParams: {query: this.createQuery()}});
  }

  private addQueryItem(queryItem: string) {
    this.queryItems.push(queryItem.trim());
    this.text = '';
    this.hideSuggestions();
  }

  private createQuery(): string {
    let query = '';
    for (let queryItem of this.queryItems) {
      query += `(${queryItem})`;
    }
    return query;
  }

}
