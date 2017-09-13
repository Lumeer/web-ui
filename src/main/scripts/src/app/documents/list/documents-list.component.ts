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

import {Component, ComponentFactoryResolver} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';

import {DocumentsPerspectivePresenter} from '../../shared/perspectives/documents/documents-perspective-presenter';
import {DocumentsPerspective, PERSPECTIVES} from '../../shared/perspectives/documents/documents-perspective';
import {PerspectiveChoice} from '../../shared/perspectives/perspective-choice';

@Component({
  templateUrl: 'documents-list.component.html'
})
export class DocumentsListComponent extends DocumentsPerspectivePresenter {

  constructor(activatedRoute: ActivatedRoute,
              componentFactoryResolver: ComponentFactoryResolver) {
    super(activatedRoute, componentFactoryResolver);
  }

  public ngOnInit() {
    Observable.combineLatest([
      this.activatedRoute.paramMap,
      this.activatedRoute.queryParamMap
    ]).subscribe(([params, queryParams]) => {
      const query = {collectionCodes: [params.get('collectionCode')]};

      this.selectedPerspective = PERSPECTIVES[queryParams.get('perspective')] || DocumentsPerspective.PostIt; // TODO probably change to Table
      this.loadPerspective(this.selectedPerspective, query);
    });
  }

  public perspectives(): PerspectiveChoice[] {
    return super.perspectives().filter(p => p !== DocumentsPerspective.Search);
  }

}
