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

import {Component, ViewChild, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss']
})
export class TableHeaderComponent {
  @Input() public header: any[];
  @Input() public color: any;
  @Input() public fixed: boolean;

  @Output() public newColumn: EventEmitter<any> = new EventEmitter();
  @Output() public removeColumn: EventEmitter<any> = new EventEmitter();
  @Output() public hideColumn: EventEmitter<any> = new EventEmitter();
  @Output() public showColumn: EventEmitter<any> = new EventEmitter();

  public hoverIndex: number = -1;

  public onHover(index) {
    this.hoverIndex = index;
  }
}
