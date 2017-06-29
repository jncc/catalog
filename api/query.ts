export class Query {
  collection: string = ''
  footprint: string = ''
  spatialop: string = ''
  fromCaptureDate: Date | undefined
  toCaptureDate: Date | undefined
  productProperties: any = {}
  errors: string[] = []
}
