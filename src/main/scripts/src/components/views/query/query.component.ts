import { Component } from '@angular/core';

@Component({
  selector: 'views-query',
  template: require('./query.component.html')
})

export class QueryComponent {
  public onFilterChanged(dataPayload) {
    console.log(dataPayload);
  }
}
