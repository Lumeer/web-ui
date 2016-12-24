import {Component, Input, EventEmitter, Output} from '@angular/core';
import * as _ from 'lodash';
import {Router} from '@angular/router';
import {Http} from '@angular/http';

@Component({
  selector: 'left-panel',
  template: require('./left-panel.component.html'),
  styles: [ require('./left-panel.component.scss').toString() ]
})

export class LeftPanelComponent {
  @Input() public collapsedValue: boolean;
  @Output() public clickEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor(public router: Router, private http: Http) {}

  public ngOnInit() {
    _.chain(this.router.config)
      .flatMap(item => item.children)
      .map((child: any) => child && child.data && child.data.contentUrl && this.fetchChildContent(child))
      .value();
  }

  public onItemClick(child: any, parent: any, link?: any) {
    this.activateChild(child);
    this.clickEvent.emit({parent: parent.data, child: child.data, link: link});
  }

  public onHomeClick(): void {
    this.clickEvent.next();
  }

  public fetchChildContent(child): void {
    child.data.childContent = this.http.get(child.data.contentUrl)
      .map(res => res.json());
  }

  private activateChild(child: any) {
    _.forEach(this.router.config, item => {
      let activeChild: any = _.find(item.children, {active: true});
      if (activeChild) {
        activeChild.data.active = false;
      }
    });
    child.data.active = true;
  }
}
