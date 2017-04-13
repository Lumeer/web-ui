import {Injectable} from '@angular/core';
import {Http} from '@angular/http';

@Injectable()
export class CompanyProject {
  public activeCompany: any;
  public activeProject: any;

  constructor(private http: Http) {}

  public fetchActiveCompany() {
    this.http.get(`${window['lumeer'].constants.publicPath}/data/activecompany.json`)
      .map(res => res.json())
      .subscribe(data => this.activeCompany = data);
  }

  public fetchActiveProject() {
    this.http.get(`${window['lumeer'].constants.publicPath}/data/activeproject.json`)
      .map(res => res.json())
      .subscribe(data => this.activeProject = data);
  }
}
