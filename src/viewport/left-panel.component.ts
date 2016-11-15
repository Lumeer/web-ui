import {Component, Input, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'left-panel',
  template: require('./left-panel.component.html'),
  styles: [ require('./left-panel.component.scss').toString() ]
})
export class LeftPanelComponent {
  @Input() public collapsedValue: boolean;
  @Output() public clickEvent: EventEmitter<any> = new EventEmitter<any>();

  public items: any[];

  constructor() {
    this.initItems();
  }

  public onItemClick(child, item) {
    this.clickEvent.emit({parent: item, child: child});
  }

  private initItems(): void {
    this.items = [
      {
        id: 'views',
        title: 'Views',
        icon: 'fa-eye',
        collapsed: true,
        children: [
          {id: 'query', title: 'Query', icon: 'fa-th-list'},
          {id: 'pivot', title: 'Pivot', icon: 'fa-plus'}
        ]
      },
      {
        id: 'forms',
        title: 'Forms',
        icon: 'fa-pencil-square-o',
        href: '#context-browser',
        collapsed: true,
        children: [
          {id: 'report', title: 'Report', icon: 'fa-area-chart'},
          {id: 'analytics', title: 'Analytics', icon: 'fa-lightbulb-o'}
        ]
      }
    ];
  }
}
