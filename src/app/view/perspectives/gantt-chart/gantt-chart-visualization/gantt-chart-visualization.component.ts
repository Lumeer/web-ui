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
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartConfig,
} from '../../../../core/store/gantt-charts/gantt-chart.model';
import * as frappeGantt from 'frappe-gantt';
@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  styleUrls: ['./gantt-chart-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  public readonly ganttChartBarsPropertiesRequired = Object.values(GanttChartBarPropertyRequired);
  public readonly ganttChartBarsPropertiesOptional = Object.values(GanttChartBarPropertyOptional);

  public gantt_chart: frappeGantt;

  constructor() {}

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
        });
      }

      if (tasks.length > 0) {
        this.gantt_chart = new frappeGantt.default('#ganttChart', tasks);
        this.gantt_chart.change_view_mode(this.config.mode);
      }
    }
  }
}
