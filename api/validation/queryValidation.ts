export class QueryValidator {
  validate(req): string[] {
    let errors: string[] = []
    let requestParameter = req.params[0]

    if (!requestParameter.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)){
      errors.push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"')
    } else {
      //todo query parameter validation
      // - parameter exists
      // - parameter arg matches property schema
    }

    return errors;
  }
}
