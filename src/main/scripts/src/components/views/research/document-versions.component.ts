import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-versions',
  template: require('./document-versions.component.html'),
  styles: [require('./document-versions.component.scss').toString()]
})
export class DocumentVersionsComponent {

  @Input() public documentVersions;
  private activeDocumentVersion: any;
  private selectedIndex: number = -1;

  public showOrHideVersion(version, index) {
    if(this.selectedIndex === index) {
      this.selectedIndex = -1;
      this.activeDocumentVersion = undefined;
    } else {
      this.selectedIndex = index;
      this.activeDocumentVersion = version;
    }
  }
}
