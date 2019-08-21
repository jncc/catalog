export const ALLOWED_OPERATORS = {
  "date-time": [">", ">=", "=", "=<", "<"],
  "date": [">", ">=", "=", "=<", "<"],
  "int": [">", ">=", "=", "=<", "<"],
  "double": [">", ">=", "=", "=<", "<"],
  "default": ["="]
};

export interface ITerm {
  property: string;
  operation: string;
  value: string;
}

export class Query {
  public offset: number = 0;
  public limit: number = 50;
  public collections: string[] = [];
  public footprint: string = "";
  public spatialop: string = "intersects";
  public terms: ITerm[] = [];
  public types: any = {};
  public productName: string = "";

  //todo get rid of this
  public get collection() : string {
    if (this.collections.length == 1){
      return this.collections[0];
    } else {
      throw new Error("More then one collection defined in query");
    }
  }
  // todo: type request
  constructor(requestParameter: string, queryParams: any) {
    if (requestParameter !== undefined){
      this.collections.unshift(requestParameter);
    }

    if ("footprint" in queryParams) {
      this.footprint = queryParams.footprint;
    }
    if ("spatialop" in queryParams) {
      this.spatialop = queryParams.spatialop;
    }
    if ("offset" in queryParams) {
      this.offset = queryParams.offset;
    }
    if ("limit" in queryParams) {
      this.limit = queryParams.limit;
    }
    // Product search parameters
    if ("terms" in queryParams) {
      this.terms = queryParams.terms;
    }
    if ("productName" in queryParams) {
      this.productName = queryParams.productName;
    }

    if ("collections" in queryParams) {
      this.collections.push.apply(this.collections, queryParams.collections)
    }

  }
}

