export class CollectionQuery {

  constructor(requestParameter: string) {
    this.collection = requestParameter;
  }

  public collection: string = "";
}

