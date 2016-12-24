import {
  Component, EventEmitter, Output, Input, trigger, state, style, transition, animate,
  keyframes
} from '@angular/core';
@Component({
  selector: 'top-panel',
  template: require('./top-panel.component.html'),
  styles: [ require('./top-panel.component.scss').toString() ],
  animations: [
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(200, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(200, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class TopPanelComponent {
  @Output() public collapseEvent = new EventEmitter();
  @Output() public logoutEvent = new EventEmitter();
  @Output() public filterSaved = new EventEmitter();
  @Input() public activeFilter;
  public newFilterName = '';

  public showSave: boolean = false;

  private currentFilter;

  public onCollapse() {
    this.collapseEvent.next();
  }

  public onLogout() {
    this.logoutEvent.next();
  }

  public onFilterChanged(dataPayload) {
    this.currentFilter = dataPayload;
  }

  public onSaveClick() {
    if (this.activeFilter) {
      this.filterSaved.emit({id: this.activeFilter.id, text: this.newFilterName, filter: this.currentFilter});
    } else {
      this.filterSaved.emit({text: this.activeFilter, filter: this.currentFilter});
    }
  }

  public ngOnChanges(changeRecord) {
    if (changeRecord['activeFilter'] && this.activeFilter) {
      this.newFilterName = this.activeFilter.title;
    }
  }
}
