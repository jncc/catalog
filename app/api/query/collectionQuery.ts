export class CollectionQuery {

  constructor(queryParams: any) {
    if ("footprint" in queryParams) {
      this.footprint = queryParams.footprint;
    }
    if ("spatialop" in queryParams) {
      this.spatialop = queryParams.spatialop;
    }
    if ("collection" in queryParams) {
      this.collection = queryParams.collection
    }
  }

  public collection: string = "";
  public footprint: string = "";
  public spatialop: string = "intersects";


}

