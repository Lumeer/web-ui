import {Component} from '@angular/core';
import {Http} from '@angular/http';

@Component({
  selector: 'views-pick-item',
  template: require('./pick-item.component.html')
})

export class PickItemComponent {

  private filterResults: any;

  constructor(private http: Http) {
    this.http.get('/data/documentdetail.json')
      .map(res => res.json())
      .subscribe(filterResults => this.filterResults = filterResults);
  }
}
