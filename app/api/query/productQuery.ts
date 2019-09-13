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

export class ProductQuery {
  public offset: number = 0;
  public limit: number = 50;
  public collections: string[] = [];
  public footprint: string = "";
  public spatialop: string = "intersects";
  public terms: ITerm[] = [];
  public types: any = {};
  public productName: string = "";

  // todo: type request
  constructor(queryParams: any) {

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

