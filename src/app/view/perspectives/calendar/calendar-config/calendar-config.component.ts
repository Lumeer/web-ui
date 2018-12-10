import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from "@angular/core";
import {CollectionModel} from "../../../../core/store/collections/collection.model";
import {CalendarBarModel, CalendarBarPropertyOptional, CalendarBarPropertyRequired, CalendarConfig} from "../../../../core/store/calendar/calendar.model";

@Component({
  selector: 'calendar-config',
  templateUrl: './calendar-config.component.html',
  styleUrls: ['./calendar-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarConfigComponent {
  @Input()
  public collection: CollectionModel;

  @Input()
  public config: CalendarConfig;

  @Output()
  public configChange = new EventEmitter<CalendarConfig>();

  public readonly calendarBarsPropertiesRequired = Object.values(CalendarBarPropertyRequired);
  public readonly calendarBarsPropertiesOptional = Object.values(CalendarBarPropertyOptional);
  public shownOptionalBar: boolean = false;

  public allRequiredPropertiesSet() {
    return (
      this.config.barsProperties[CalendarBarPropertyRequired.NAME] &&
      this.config.barsProperties[CalendarBarPropertyRequired.START_DATE] &&
      this.config.barsProperties[CalendarBarPropertyRequired.END_DATE]
    );
  }

  public onBarPropertyRequiredSelect(type: CalendarBarPropertyRequired, bar: CalendarBarModel) {
    const bars = {...this.config.barsProperties, [type]: bar};
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRequiredRemoved(type: CalendarBarPropertyRequired) {
    const bars = {...this.config.barsProperties};
    delete bars[type];
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyOptionalSelect(type: CalendarBarPropertyOptional, bar: CalendarBarModel) {
    const bars = {...this.config.barsProperties, [type]: bar};
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyOptionalRemoved(type: CalendarBarPropertyOptional) {
    const bars = {...this.config.barsProperties};
    delete bars[type];
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public removeAllBarPropertiesOptional(){
    const bars = {...this.config.barsProperties};
    this.calendarBarsPropertiesOptional.forEach(barOptionalProperty => {
      if (bars[barOptionalProperty])
        delete bars[barOptionalProperty]
    });
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public toggleOptionalBar(){
    if(this.shownOptionalBar){
      this.removeAllBarPropertiesOptional();
    }
    this.shownOptionalBar = !this.shownOptionalBar;
  }
}
