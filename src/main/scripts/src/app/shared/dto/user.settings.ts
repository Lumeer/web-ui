export class UserSettings {

  public defaultOrganization: string;
  public defaultProject: string;

  constructor(defaultOrg: string, defaultProj: string) {
    this.defaultOrganization = defaultOrg;
    this.defaultProject = defaultProj;
  }

}
