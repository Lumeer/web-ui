import {Component, Input, style, state, keyframes, animate, transition, trigger} from '@angular/core';

@Component({
  selector: 'history-chat',
  template: require('./history-chat.component.html'),
  styles: [require('./history-chat.component.scss').toString()],
  animations: [
    trigger('animateWidth', [
      state('in', style({width: '*'})),
      transition('void => *', [
        animate(300, keyframes([
          style({width: 0, offset: 0}),
          style({width: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(300, keyframes([
          style({width: '*', offset: 0}),
          style({width: 0, offset: 1})
        ]))
      ])
    ])
  ]
})

export class HistoryChatComponent {
  public toggleVisible: boolean = false;
  @Input() public  activeDocument: any;
}
