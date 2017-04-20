import {Injectable} from '@angular/core';
import {Http} from '@angular/http';

@Injectable()
export class CompanyProject {
  public activeCompany: any;
  public activeProject: any;
  public allCompanies: any;
  public allProjects: any;

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

  public fetchAllCompanies() {
    return this.http.get(`${window['lumeer'].constants.publicPath}/data/companies.json`)
      .map(res => res.json());
  }

  public fetchAllProjects() {
    return this.http.get(`${window['lumeer'].constants.publicPath}/data/companies.json`)
      .map(res => res.json());
  }
}
