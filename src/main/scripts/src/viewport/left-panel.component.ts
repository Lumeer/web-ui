import {
  Component, Input, EventEmitter, Output, trigger, state, style, transition, animate,
  keyframes
} from '@angular/core';
import * as _ from 'lodash';
import {Router} from '@angular/router';
import {Http} from '@angular/http';
import {NavigationChildrenService} from '../services/navigation-children.service';

@Component({
  selector: 'left-panel',
  template: require('./left-panel.component.html'),
  styles: [ require('./left-panel.component.scss').toString() ],
  animations: [
    trigger('animateVisible', [
      state('in', style({height: '*', width: '*', opacity: '*'})),
      transition('void => *', [
        animate(350, keyframes([
          style({height: 0, width: 0, opacity: 0, offset: 0}),
          style({height: '*', width: '*', opacity: '*', offset: 0.2}),
          style({transform: 'translateX(15px)', offset: 0.4}),
          style({transform: 'translateX(-15px)', offset: 0.6}),
          style({transform: 'translateX(15px)', offset: 0.8}),
          style({transform: 'translateX(0)', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(200, keyframes([
          style({height: '*', width: '*', opacity: '*', overflow: 'hidden', offset: 0}),
          style({height: 0, width: 0, opacity: 0, overflow: 'auto', offset: 1})
        ]))
      ])
    ])
  ]
})

export class LeftPanelComponent {
  @Input() public collapsedValue: boolean;
  @Output() public clickEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor(public router: Router, private navigationChildren: NavigationChildrenService) {}

  public ngOnInit() {
    this.navigationChildren.fetchDataForChildren();
    // _.chain(this.router.config)
    //   .flatMap(item => item.children)
    //   .map((child: any) => child && child.data && child.data.contentUrl && this.fetchChildContent(child))
    //   .value();
  }

  public onItemClick(child: any, parent: any, link?: any) {
    this.activateChild(child);
    this.clickEvent.emit({parent: parent.data, child: child.data, link: link});
  }

  public onHomeClick(): void {
    this.clickEvent.next();
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
