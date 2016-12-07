import {Component, EventEmitter, Output} from '@angular/core';
@Component({
  selector: 'top-panel',
  template: require('./top-panel.component.html'),
  styles: [ require('./top-panel.component.scss').toString() ]
})
export class TopPanelComponent {
  @Output() public collapseEvent = new EventEmitter();

  public onCollapse() {
    this.collapseEvent.next();
  }
}
