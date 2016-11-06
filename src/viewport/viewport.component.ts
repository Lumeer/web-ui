import { Component } from '@angular/core';

@Component({
  selector: 'view-port',
  template: require('./viewport.component.html')
})

export class ViewPortComponent {
  public collapsed: boolean = false;

  public handleCollapseEvent() {
    this.collapsed = !this.collapsed;
  }
}
