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

import {Component, ViewChild} from '@angular/core';

@Component({
  selector: 'static-table',
  templateUrl: './static-table.component.html',
  styleUrls: ['./static-table.component.scss']
})
export class StaticTableComponent {
  public data = {
    settings: {
      color: '#3498DB',
      highlightColor: '#F39C12'
    },
    header: [{label: 'first', active: false}, {label: 'second', active: false}, {label: 'third', active: false}],
    rows: [
      [{label: 'one'}, {label: 'two'}, {label: 'three'}],
      [{label: 'one'}, {label: ''}, {label: 'three'}],
      [{label: 'one'}, {label: 'two'}, {label: ''}],
    ],
    activeRow: -1
  };

  public onNewColumn() {
    this.data.header = [...this.data.header, {label: '', active: false}];
    this.data.rows = this.data.rows.map(data => [...data, {label: ''}]);
  }

  public onNewRow() {
    this.data.rows = [...this.data.rows, StaticTableComponent.generateData(this.data.header)];
  }

  public onItemHighlight(index, data) {
    this.data.activeRow = index;
    this.data.header = StaticTableComponent.inactivateItems(this.data.header);
    this.data.header[data.colIndex].active = true;
  }

  public onTableBlur() {
    this.data.activeRow = -1;
    this.data.header = StaticTableComponent.inactivateItems(this.data.header);
  }

  public onUpdateRow(rowIndex, dataPayload) {
    this.data.rows[rowIndex][dataPayload.index].label = dataPayload.data;
  }

  public onRemoveColumn(colIndex) {
    this.data.header.splice(colIndex, 1);
    this.data.rows = this.data.rows.map(oneRow => {oneRow.splice(colIndex, 1); return oneRow;});
  }

  public showHideColumn(colIndex, hidden: boolean) {
    this.data.header[colIndex]['hidden'] = hidden;
    this.data.rows = this.data.rows.map(oneRow => {oneRow[colIndex]['hidden'] = hidden; return oneRow;});
  }

  private static generateData(header) {
    return header.map(data => {return {label: ''};});
  }

  private static inactivateItems(items) {
    return items.map(data => {data.active = false; return data;});
  }
}
