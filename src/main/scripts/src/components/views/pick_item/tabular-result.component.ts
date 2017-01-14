import {Component, Input} from '@angular/core';

@Component({
  selector: 'tabular-result',
  template: require('./tabular-result.component.html'),
  styles: [require('./tabular-result.component.scss').toString()]
})
export class TabularResultComponent {

  @Input() public data: any;

  private selectItem(document) {
    console.log(document);
  }

}
