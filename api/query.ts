export class Query {
  collection: string = ''
  footprint: string = ''
  spatialop: string = ''
  fromCaptureDate: Date | undefined = undefined
  toCaptureDate: Date | undefined = undefined
  productProperties: any = {}
  errors: string[] = []
}
