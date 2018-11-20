import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {CollectionModel} from "../../../../core/store/collections/collection.model";
import {Perspective} from "../../perspective";
import {GanttChartBarModel, GanttChartBarType, GanttChartConfig, GanttChartMode} from "../../../../core/store/gantt-charts/gantt-chart.model";

@Component({
  selector: 'gantt-chart-config',
  templateUrl: './gantt-chart-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GanttChartConfigComponent {

  @Input()
  public collection: CollectionModel;

  @Input()
  public config: GanttChartConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  public readonly ganntChartViewMode = 'view mode';
  public readonly ganttChartModes = Object.values(GanttChartMode);
  public readonly ganttChartPerspective = Perspective.GanttChart;
  public readonly ganttChartBars = Object.values(GanttChartBarType);

  public onModeSelect(mode: GanttChartMode) {
    const newConfig = {...this.config, mode: mode};
    this.configChange.emit(newConfig);
  }

  public onBarSelect(type: GanttChartBarType, bar: GanttChartBarModel) {
    const bars = {...this.config.bars, [type]: bar};
    const newConfig = {...this.config, bars: bars};
    this.configChange.emit(newConfig)
  }

  public onBarRemoved(type: GanttChartBarType) {
    const bars = {...this.config.bars};
    delete bars[type];
    const newConfig = {...this.config, bars: bars};
    this.configChange.emit(newConfig);
  }
}
