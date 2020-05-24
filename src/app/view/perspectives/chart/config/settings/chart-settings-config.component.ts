import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {ChartConfig} from '../../../../../core/store/charts/chart';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {deepObjectCopy} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'chart-settings-config',
  templateUrl: './chart-settings-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartSettingsConfigComponent {

  @Input()
  public config: ChartConfig;

  @Output()
  public configChange = new EventEmitter<ChartConfig>();

  public readonly lockAxesId = generateId();
  public readonly rangeSliderId = generateId();

  public onLockAxesChange(checked: boolean) {
    this.onBooleanPropertyChange('lockAxes', checked);
  }

  public onRangeSliderChange(checked: boolean) {
    this.onBooleanPropertyChange('rangeSlider', checked);
  }

  private onBooleanPropertyChange(property: string, checked: boolean) {
    const config = deepObjectCopy<ChartConfig>(this.config);
    if (checked) {
      config[property] = true;
    } else {
      delete config[property];
    }

    this.configChange.emit(config);
  }
}
