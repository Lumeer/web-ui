import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {Perspective} from '../../perspective';
import {
  GanttChartBarModel,
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartConfig,
  GanttChartMode,
} from '../../../../core/store/gantt-charts/gantt-chart';

@Component({
  selector: 'gantt-chart-config',
  templateUrl: './gantt-chart-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartConfigComponent {
  @Input()
  public collection: Collection;

  @Input()
  public config: GanttChartConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  public readonly ganntChartViewMode = 'view mode';
  public readonly ganttChartModes = Object.values(GanttChartMode);
  public readonly ganttChartBarsPropertiesRequired = Object.values(GanttChartBarPropertyRequired);
  public readonly ganttChartBarsPropertiesOptional = Object.values(GanttChartBarPropertyOptional);

  public propertiesNotSetYet: boolean = true;

  public allRequiredPropertiesSet() {
    //this.propertiesNotSetYet = false;
    return (
      this.config.mode &&
      this.config.barsProperties[GanttChartBarPropertyRequired.NAME] &&
      this.config.barsProperties[GanttChartBarPropertyRequired.START] &&
      this.config.barsProperties[GanttChartBarPropertyRequired.END] &&
      !(this.propertiesNotSetYet = false)
    );
  }

  public onModeSelect(mode: GanttChartMode) {
    const newConfig = {...this.config, mode: mode};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRequiredSelect(type: GanttChartBarPropertyRequired, bar: GanttChartBarModel) {
    const bars = {...this.config.barsProperties, [type]: bar};
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRequiredRemoved(type: GanttChartBarPropertyRequired) {
    const bars = {...this.config.barsProperties};
    delete bars[type];
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyOptionalSelect(type: GanttChartBarPropertyOptional, bar: GanttChartBarModel) {
    const bars = {...this.config.barsProperties, [type]: bar};
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyOptionalRemoved(type: GanttChartBarPropertyOptional) {
    const bars = {...this.config.barsProperties};
    delete bars[type];
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }
}
