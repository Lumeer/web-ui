import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, SimpleChanges, OnChanges, ViewEncapsulation, ViewChild, ElementRef} from '@angular/core';
import {CollectionModel} from "../../../../core/store/collections/collection.model";
import {DocumentModel} from "../../../../core/store/documents/document.model";
import {GanttChartBarType, GanttChartConfig} from "../../../../core/store/gantt-charts/gantt-chart.model";
import * as frappeGantt from 'frappe-gantt';
@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  styleUrls: ['./gantt-chart-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GanttChartVisualizationComponent implements OnChanges {

  @Input()
  public collection: CollectionModel;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: GanttChartConfig;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public gantt_chart: frappeGantt;

  // @ViewChild('ganttChart')
  // private ganttChartElement: ElementRef;

  constructor() {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config) && this.config) {
      this.visualize();
    }
  }

  private visualize() {

    // if (this.config.mode != null) console.log('mode: '+this.config.mode);
    // if (this.config.bars[GanttChartBarType.NAME] != null) console.log('name: '+this.config.bars[GanttChartBarType.NAME].attributeId);
    // if (this.config.bars[GanttChartBarType.START] != null) console.log('start: '+this.config.bars[GanttChartBarType.START].attributeId);
    // if (this.config.bars[GanttChartBarType.END] != null) console.log('end: '+this.config.bars[GanttChartBarType.END].attributeId);

    // console.log("collectin: ",this.collection);

    if (this.config.mode != null && this.config.bars[GanttChartBarType.NAME] != null && this.config.bars[GanttChartBarType.START] != null && this.config.bars[GanttChartBarType.END] != null){

      const tasks = [];

      for (const document of this.documents) {
        const name = document.data[this.config.bars[GanttChartBarType.NAME].attributeId];
        const start = document.data[this.config.bars[GanttChartBarType.START].attributeId];
        const end = document.data[this.config.bars[GanttChartBarType.END].attributeId];
        //
        // console.log("document: ",document);
        // console.log("this.config.bars[GanttChartBarType.NAME].attributeId: ",this.config.bars[GanttChartBarType.NAME].attributeId);
        // console.log("this.config.bars[GanttChartBarType.START].attributeId: ",this.config.bars[GanttChartBarType.START].attributeId);
        // console.log("this.config.bars[GanttChartBarType.END: ",this.config.bars[GanttChartBarType.END].attributeId);

        if (name != null && start != null && end != null) {
          tasks.push({
            name: name,
            start: start,
            end: end,
            progress: 20
          });
        }
      }

      if (tasks != null){
        this.gantt_chart = new frappeGantt.default('#ganttChart', tasks);
        this.gantt_chart.change_view_mode(this.config.mode);
      }
    }

  }

}
