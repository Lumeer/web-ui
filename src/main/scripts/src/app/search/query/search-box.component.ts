/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
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
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/switchMap';
import {Component, OnInit} from '@angular/core';
import {Suggestion} from './suggestion';
import {SearchService} from '../search.service';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'search-box',
  template: require('./search-box.component.html'),
  styles: [require('./search-box.component.scss').toString()]
})
export class SearchBoxComponent implements OnInit {

  private static TYPES = ['All', 'Attribute', 'Collection', 'Link', 'View'];

  private query: string[];
  private type = 'All';
  private text = '';

  private types: string[];
  private searchTerms = new Subject<string>();
  private suggestions: Observable<Suggestion[]>;

  constructor(private searchService: SearchService) {
  }

  public suggestTypes(): void {
    if (!this.text) {
      this.types = SearchBoxComponent.TYPES;
    }
  }

  public selectType(type: string) {
    this.type = type.toLowerCase();
    this.text = type + ':';
  }

  public suggest(term: string): void {
    this.types = [];
    this.searchTerms.next(term);
  }

  public complete(suggestion: Suggestion): void {
    this.text = this.text + suggestion.text;
  }

  public ngOnInit(): void {
    this.suggestions = this.searchTerms
      .startWith('')
      .debounceTime(300)
      .distinctUntilChanged()
      .switchMap(term => {
        let text = term.split(':', 2);
        return text[1] ? this.searchService.suggest(text[1], this.type) : Observable.of<Suggestion[]>([]);
      })
      .catch(error => {
        console.error(error); // TODO: add real error handling
        return Observable.of<Suggestion[]>([]);
      });
  }

}
