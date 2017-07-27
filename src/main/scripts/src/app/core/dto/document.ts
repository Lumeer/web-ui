export class Document {

  public id: string;
  public creationDate: string;
  public createdBy: string;
  public version: number;
  public attributes: object[] = [];

  constructor(documentJson?: object) {
    if (documentJson) {
      this.id = documentJson['_id'];
      delete documentJson['_id'];

      this.creationDate = documentJson['_meta-create-date'];
      delete documentJson['_meta-create-date'];

      this.createdBy = documentJson['_meta-create-user'];
      delete documentJson['_meta-create-user'];

      this.version = documentJson['_meta-version'];
      delete documentJson['_meta-version'];

      Object.keys(documentJson)
        .forEach(attribute => this.put(attribute, documentJson[attribute]));
    }
  }

  public put(key: any, value: any) {
    let newAttributeObject = {};
    newAttributeObject[key] = value;

    this.attributes.push(newAttributeObject);
  }

  public toJson(): object {
    let result = {};

    if (this.id && this.creationDate && this.createdBy && this.version !== undefined) {
      result['_id'] = this.id;
      result['_meta-create-date'] = this.creationDate;
      result['_meta-create-user'] = this.createdBy;
      result['_meta-version'] = this.version;
    }

    this.attributes.forEach(attributeObject => {
      Object.keys(attributeObject)
        .forEach(key => result[key] = attributeObject[key]);
    });

    return result;
  }

}
