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
import {CalendarBarPropertyOptional, CalendarBarPropertyRequired, CalendarConfig} from '../../../../core/store/calendar/calendar.model';
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
      this.config.barsProperties[CalendarBarPropertyRequired.START_DATE] &&
      this.config.barsProperties[CalendarBarPropertyRequired.END_DATE]
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
        if (CalendarVisualizationComponent.isValidDate(document.data[this.config.barsProperties[CalendarBarPropertyRequired.START_DATE].attributeId])
          || CalendarVisualizationComponent.isValidDate(document.data[this.config.barsProperties[CalendarBarPropertyRequired.END_DATE].attributeId])) {

          let titleFromDocument = document.data[this.config.barsProperties[CalendarBarPropertyRequired.NAME].attributeId];
          let startFromDocument = document.data[this.config.barsProperties[CalendarBarPropertyRequired.START_DATE].attributeId];
          let endFromDocument = document.data[this.config.barsProperties[CalendarBarPropertyRequired.END_DATE].attributeId];

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

          //optional
          if (this.config.barsProperties[CalendarBarPropertyOptional.START_TIME] &&
            this.config.barsProperties[CalendarBarPropertyOptional.END_TIME]) {
            let startTime = document.data[this.config.barsProperties[CalendarBarPropertyOptional.START_TIME].attributeId];
            if (CalendarVisualizationComponent.isValidTime(startTime)
              && (typeof startTime !== 'undefined')) {
              let time = CalendarVisualizationComponent.createTime(startTime);
              start.setHours(time[0]);
              start.setMinutes(time[1]);
            }
            else if (CalendarVisualizationComponent.isValidTime(startTime) && (typeof startTime == 'undefined')) {
              start.setHours(0);
              start.setMinutes(0);
            }
            let endTime = document.data[this.config.barsProperties[CalendarBarPropertyOptional.END_TIME].attributeId];
            if (CalendarVisualizationComponent.isValidTime(endTime)
              && (typeof endTime !== 'undefined')) {
              let time = CalendarVisualizationComponent.createTime(endTime);
              end.setHours(time[0]);
              end.setMinutes(time[1]);
            }
            else if (CalendarVisualizationComponent.isValidTime(endTime) && (typeof endTime == 'undefined')) {
              end.setHours(23);
              end.setMinutes(59);
            }
            console.log(start);
            console.log(end);
          }

          this.events.push({
            title: title,
            start: start,
            end: end,
            color: this.getColor(i % 2 === 0, this.collection.color),
            allDay: false,
            draggable: true,
            resizable:{
              beforeStart: true,
              afterEnd: true
            },
            meta:{
              documentId: document.id,
              collectionId: document.collectionId
            }
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

  private static createTime(dateString) {
    let separators = ['\\:', '\\.'];
    return dateString.split(new RegExp(separators.join('|'), 'g'));
  }

  //expected input hh:mm or hh.mm
  private static isValidTime(string) {
    if (string != undefined) {
      let separators = ['\\:', '\\.'];
      let bits = string.split(new RegExp(separators.join('|'), 'g'));
      let date = new Date();
      date.setHours(bits[0]);
      date.setMinutes(bits[1]);
      return date.getHours() == bits[0] && date.getMinutes() == bits[1];
    }
    else return "0:00";
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
    console.log(this.events);
    this.decomposeEvent(event);
    this.refresh.next();
  }

  dateToString (date: Date) {
    return date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
  }

  timeToString (date: Date) {
    return date.getHours() + ":" + (date.getMinutes()<10?'0':'') + date.getMinutes();
  }

  decomposeEvent(event){
    let originalDocument = this.documents.find(document => document.id === event.meta.documentId);
    originalDocument.data[this.config.barsProperties[CalendarBarPropertyRequired.NAME].attributeId] = event.title;
    originalDocument.data[this.config.barsProperties[CalendarBarPropertyRequired.START_DATE].attributeId] = this.dateToString(event.start);
    originalDocument.data[this.config.barsProperties[CalendarBarPropertyRequired.END_DATE].attributeId] = this.dateToString(event.end);
    originalDocument.data[this.config.barsProperties[CalendarBarPropertyOptional.START_TIME].attributeId] = this.timeToString(event.start);
    originalDocument.data[this.config.barsProperties[CalendarBarPropertyOptional.END_TIME].attributeId] = this.timeToString(event.end);
    //console.log(originalDocument);
    this.patchData.emit(originalDocument);
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
