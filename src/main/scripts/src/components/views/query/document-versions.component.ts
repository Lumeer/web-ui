import {Component, Input} from '@angular/core';

@Component({
  selector: 'document-versions',
  template: require('./document-versions.component.html'),
  styles: [require('./document-versions.component.scss').toString()]
})
export class DocumentVersionsComponent{

  @Input() public documentVersions;
  private activeDocumentVersion:any = undefined;
  private selectedIndex: number = -1;

  constructor(){}

  public showOrHideVersion(version, ix){
    if(this.selectedIndex == ix){
      this.selectedIndex = -1;
      this.activeDocumentVersion = undefined;
    }else{
      this.selectedIndex = ix;
      this.activeDocumentVersion = version;
    }
  }

}

