export class Query {
  //todo: type request
  constructor(req) {
    let requestParameter = req.params[0]
    let queryParams = req.query

    this.collection = req.params[0]

    for (let parameter in queryParams) {
      if (parameter === 'footprint') {
        this.footprint = queryParams[parameter];
      } else if (parameter === 'spatialop') {
        this.spatialop = queryParams[parameter];
      } else if (parameter === 'fromCaptureDate') {
        this.fromCaptureDate = new Date(queryParams[parameter])
      } else if (parameter === 'toCaptureDate') {
        this.toCaptureDate = new Date(queryParams[parameter])
      } else if (parameter) {
        this.productProperties[parameter] = queryParams[parameter];
      }
    }
  }

  collection: string = ''
  footprint: string = ''
  spatialop: string = ''
  fromCaptureDate: Date | undefined = undefined
  toCaptureDate: Date | undefined = undefined
  productProperties: any = {}
}
