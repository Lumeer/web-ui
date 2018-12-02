import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  ViewEncapsulation
} from '@angular/core';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {CalendarBarPropertyRequired, CalendarConfig} from '../../../../core/store/calendar/calendar.model';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView
} from 'angular-calendar';
import {Subject} from 'rxjs';
import {setHours, setMinutes, isSameMonth, isSameDay, startOfDay, endOfDay, addHours, addDays, endOfMonth, subDays} from 'date-fns';


@Component({
  selector: 'calendar-visualization',
  templateUrl: './calendar-visualization.component.html',
  styleUrls: ['./calendar-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarVisualizationComponent implements OnChanges {
  @Input()
  public collection: CollectionModel;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: CalendarConfig;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  // public readonly calendarBarsPropertiesRequired = Object.values(CalendarBarPropertyRequired);
  // public readonly ganttChartBarsPropertiesOptional = Object.values(GanttChartBarPropertyOptional);

  // public calendar: calendar;
  view: CalendarView = CalendarView.Month;

  CalendarView = CalendarView;

  viewDate: Date = new Date();

  actions: CalendarEventAction[] = [];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [];
  shownEvents: CalendarEvent[] = [];

  constructor() {}

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config) && this.config) {
      this.visualize();
    }
  }

  private visualize() {
    if (
      this.config.barsProperties[CalendarBarPropertyRequired.NAME] &&
      this.config.barsProperties[CalendarBarPropertyRequired.START] &&
      this.config.barsProperties[CalendarBarPropertyRequired.END]
    ) {

      this.events = [];
      let title;
      let start;
      let end;
      let i = 0;

      for (const document of this.documents) {
        title = 'No title';
        start = undefined;
        end = undefined;
        i = i + 1;
        if (CalendarVisualizationComponent.isValidDate(document.data[this.config.barsProperties[CalendarBarPropertyRequired.START].attributeId])
          || CalendarVisualizationComponent.isValidDate(document.data[this.config.barsProperties[CalendarBarPropertyRequired.END].attributeId])) {

          let titleFromDocument = document.data[this.config.barsProperties[CalendarBarPropertyRequired.NAME].attributeId];
          let startFromDocument = document.data[this.config.barsProperties[CalendarBarPropertyRequired.START].attributeId];
          let endFromDocument = document.data[this.config.barsProperties[CalendarBarPropertyRequired.END].attributeId];

          if (titleFromDocument !== '')
            title = titleFromDocument;

          if (CalendarVisualizationComponent.isValidDate(startFromDocument))
            start = CalendarVisualizationComponent.createDate(startFromDocument);
          else
            start = CalendarVisualizationComponent.createDate(endFromDocument);

          if (CalendarVisualizationComponent.isValidDate(endFromDocument))
            end = CalendarVisualizationComponent.createDate(endFromDocument);
          else
            end = CalendarVisualizationComponent.createDate(startFromDocument);

          this.events.push({
            title: title,
            start: start,
            end: end,
            color: this.getColor(i % 2 === 0, this.collection.color),
            allDay: true
          });
        }
      }
      this.refresh.next();
    }
  }

  private static createDate(dateString) {
    let separators = ['\\.', '\\-', '\\/'];
    let bits = dateString.split(new RegExp(separators.join('|'), 'g'));
    return new Date(bits[2], bits[1] - 1, bits[0]);
  }

  //expected input dd/mm/yyyy or dd.mm.yyyy or dd-mm-yyyy
  private static isValidDate(string) {
    if (string === undefined)
      return false;
    let separators = ['\\.', '\\-', '\\/'];
    let bits = string.split(new RegExp(separators.join('|'), 'g'));
    let date = new Date(bits[2], bits[1] - 1, bits[0]);
    return date.getFullYear() == bits[2] && date.getMonth() + 1 == bits[1];
  }

  dayClicked({date, events}: { date: Date; events: CalendarEvent[] }): void {
    this.shownEvents = events;
    this.viewDate = date;
  }


  eventTimesChanged({
                      event,
                      newStart,
                      newEnd
                    }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();
  }

  private getColor (allDay: boolean, color: string){

    if (allDay)
      return {
        primary: color,
        secondary: CalendarVisualizationComponent.LightenDarkenColor(color, 100)
      };
    else
      return {
        primary: CalendarVisualizationComponent.LightenDarkenColor(color, -100),
        secondary: CalendarVisualizationComponent.LightenDarkenColor(color, 70)
      };
  }

  private static LightenDarkenColor(color: string, amt: number) {

    let usePound = false;

    if (color[0] == '#') {
      color = color.slice(1);
      usePound = true;
    }

    let num = parseInt(color, 16);

    let r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00FF) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
  }
}
