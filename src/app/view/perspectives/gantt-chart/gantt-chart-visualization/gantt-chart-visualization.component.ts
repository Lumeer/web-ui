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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartConfig,
} from '../../../../core/store/gantt-charts/gantt-chart';
import * as frappeGantt from 'frappe-gantt';
import * as moment from 'moment';

declare let $: any;

@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  styleUrls: ['./gantt-chart-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartVisualizationComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: GanttChartConfig;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public readonly ganttChartBarsPropertiesRequired = Object.values(GanttChartBarPropertyRequired);
  public readonly ganttChartBarsPropertiesOptional = Object.values(GanttChartBarPropertyOptional);

  public gantt_chart: frappeGantt;

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config) && this.config) {
      this.visualize();
    }
  }

  private visualize() {
    if (
      this.config.mode &&
      this.config.barsProperties[GanttChartBarPropertyRequired.NAME] &&
      this.config.barsProperties[GanttChartBarPropertyRequired.START] &&
      this.config.barsProperties[GanttChartBarPropertyRequired.END]
    ) {
      const tasks = [];

      for (const document of this.documents) {
        const name = document.data[this.config.barsProperties[GanttChartBarPropertyRequired.NAME].attributeId];
        const start = document.data[this.config.barsProperties[GanttChartBarPropertyRequired.START].attributeId];
        const end = document.data[this.config.barsProperties[GanttChartBarPropertyRequired.END].attributeId];

        let id = null,
          dependencies = null,
          progress = null;

        if (this.config.barsProperties[GanttChartBarPropertyOptional.ID])
          id = document.data[this.config.barsProperties[GanttChartBarPropertyOptional.ID].attributeId];
        if (this.config.barsProperties[GanttChartBarPropertyOptional.DEPENDENCIES])
          dependencies =
            document.data[this.config.barsProperties[GanttChartBarPropertyOptional.DEPENDENCIES].attributeId];
        if (this.config.barsProperties[GanttChartBarPropertyOptional.PROGRESS])
          progress = document.data[this.config.barsProperties[GanttChartBarPropertyOptional.PROGRESS].attributeId];

        tasks.push({
          name: name,
          start: start,
          end: end,
          id: id,
          dependencies: dependencies,
          progress: progress,
          document_id: document.id,
        });
      }

      if (tasks.length > 0) {
        this.gantt_chart = new frappeGantt.default('#ganttChart', tasks, {
          on_date_change: (task, start, end) => {
            const startAttID = this.config.barsProperties[GanttChartBarPropertyRequired.START].attributeId;
            const endAttID = this.config.barsProperties[GanttChartBarPropertyRequired.END].attributeId;

            const startTimeTask = moment(task.start, 'YYYY-MM-DD').local();
            const startTime = moment(start, 'YYYY-MM-DD').local();

            const endTimeTask = moment(task.end, 'YYYY-MM-DD').local();
            const endTime = moment(end, 'YYYY-MM-DD').local();

            //start time changed
            if (startTimeTask !== startTime)
              this.onValueChanged(task.document_id, startAttID, startTime.format('YYYY-MM-DD'));

            //end time changed
            if (endTimeTask !== endTime) this.onValueChanged(task.document_id, endAttID, endTime.format('YYYY-MM-DD'));
          },

          on_progress_change: (task, progress) => {
            const progressAttID = this.config.barsProperties[GanttChartBarPropertyOptional.PROGRESS].attributeId;

            this.onValueChanged(task.document_id, progressAttID, progress);
          },
        });
        this.gantt_chart.change_view_mode(this.config.mode);

        const textColor = GanttChartVisualizationComponent.getContrastYIQ(this.collection.color.substring(1, 6));
        $('.gantt .bar').css('fill', this.collection.color);
        $('.gantt .bar-label').css('fill', textColor);
        if (textColor === 'black') {
          $('.gantt .bar-progress').css(
            'fill',
            GanttChartVisualizationComponent.LightenDarkenColor(this.collection.color, -30)
          );
        } else {
          $('.gantt .bar-progress').css(
            'fill',
            GanttChartVisualizationComponent.LightenDarkenColor(this.collection.color, 50)
          );
        }
      }
    }
  }

  private onValueChanged(documentId: string, attributeId: string, value: string) {
    const changedDocument = this.documents.find(document => document.id === documentId);
    if (!changedDocument) {
      return;
    }

    const patchDocument = {...changedDocument, data: {[attributeId]: value}};
    this.patchData.emit(patchDocument);
  }

  private static getContrastYIQ(hexcolor) {
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
  }

  private static LightenDarkenColor(color: string, amt: number) {
    let usePound = false;
    if (color[0] === '#') {
      color = color.slice(1);
      usePound = true;
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00ff) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000ff) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
  }
}
