import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'document-rights',
  template: require('./document-rights.component.html'),
  styles: [require('./document-rights.component.scss').toString()]
})
export class DocumentRightsComponent implements OnInit {

  @Input() public rights: any;
  private rightsCopy: any;

  ngOnInit(): void {
    this.rightsCopy = JSON.parse(JSON.stringify(this.rights));
  }

  private onSearchChanged(userFilter: any) {
    if (userFilter == '') {
      this.rightsCopy = JSON.parse(JSON.stringify(this.rights));
    } else {
      this.filterUsers(userFilter);
    }
  }

  private filterUsers(userFilter: string) {
    let newRights = [];
    this.rights.forEach(right => {
      if (right.name.includes(userFilter))
        newRights.push(right);
    });
    this.rightsCopy = newRights;
  }

  private bitSet(value: number, bit: number) {
    return ((value >> bit) % 2 != 0)
  }

  private bitUnset(value: number, bit: number) {
    return ((value >> bit) % 2 == 0)
  }


}
