export const ALLOWED_OPERATORS = {
  "date-time": {
    allowed: [">", ">=", "=", "=<", "<"]
  },
  "date": {
    allowed: [">", ">=", "=", "=<", "<"]
  },
  "int": {
    allowed: [">", ">=", "=", "=<", "<"]
  },
  "double": {
    allowed: [">", ">=", "=", "=<", "<"]
  },
  "default": {
    allowed: ["="]
  }
};

export interface ITerm {
  property: string;
  operation: string;
  value: string;
}

export class Query {
  public offset: number = 0;
  public limit: number = 50;
  public collection: string = "";
  public footprint: string = "";
  public spatialop: string = "";
  public terms: ITerm[] = [];
  public productName: string = "*";

  // todo: type request
  constructor(requestParameter: string, queryParams: any) {
    this.collection = requestParameter;

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

  }
}
