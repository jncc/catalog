export class Query {
  collection: string = ''
  footprint: string = ''
  spatialop: string = ''
  fromCollectionDate: Date | undefined
  toCollectionDate: Date | undefined
  productProperties: any = {}
  errors: string[] = []
}
