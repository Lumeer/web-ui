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

import {Component, Input} from '@angular/core';
import {PerspectiveChoice} from '../perspectives/perspective-choice';
import {Router} from '@angular/router';

@Component({
  selector: 'perspective-chooser',
  templateUrl: './perspective-chooser.component.html'
})
export class PerspectiveChooserComponent {

  @Input()
  public perspectives: PerspectiveChoice[];

  @Input()
  public selectedPerspective: PerspectiveChoice;

  constructor(private router: Router) {
  }

  public onSelectPerspective(perspectiveId: string) {
    this.router.navigate([], {
      queryParams: {
        perspective: perspectiveId
      },
      queryParamsHandling: 'merge'
    });
  }

}
