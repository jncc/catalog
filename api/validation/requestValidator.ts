import * as wellknown from "wellknown"
import * as geojson from "geojson"

//test reqs
import 'mocha';
import * as chai from 'chai';

require('mocha-inline')();

export class RequestValidator {
  static validate(reqParam: string, queryParams): string[] {
    let errors: string[] = []

    let fromCaptureDate: Date
    let toCaptureDate: Date
    this.validateRequestParameter(reqParam, errors)
     for (let parameter in queryParams) {
      if (parameter === 'footprint') {
        this.validateFootprint(queryParams[parameter], errors);
      } else if (parameter === 'spatialop') {
        this.validateSpatialOp(queryParams[parameter], errors);
      } else if (parameter === 'fromCaptureDate') {
        this.validateFromCaptureDate(queryParams[parameter], errors)
      } else if (parameter === 'toCaptureDate') {
        this.validateToCaptureDate(queryParams[parameter], errors)
      }
    };

    return errors;
  }

  private static validateRequestParameter(requestParameter: string, errors: string[] ) {
    if (!requestParameter.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)){
      errors.push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"')
    }

  }

  private static validateFootprint(param: string, errors: string[] ) {
    let footprint = <geojson.Polygon>wellknown.parse(param)
    if(!footprint) {
      errors.push('footprint | is not valid WKT')
    } else {
      let firstCoord = footprint.coordinates[0]
      let lastCoord = footprint.coordinates[footprint.coordinates.length - 1]

      if (! firstCoord.every((element, index) => {return element === lastCoord[index]})) {
         errors.push('footprint | is not a closed polygon')
      }

    }
  }

  private static validateSpatialOp(param: string, errors: string[] ) {
    if (!['within', 'intersects', 'overlaps'].find(val => val === param)) {
      errors.push('spatialop | should be one of "within", "intersects", "overlaps"')
    }
  }
  private static validateFromCaptureDate(param: string, errors: string[] ) {}
  private static validateToCaptureDate(param: string, errors: string[] ) {}
}


describe('Request Validator', () => {
  let p = '*test/valid/pat*h/1/2/345aa*'

  it('should validate a valid search path', () => {
    chai.expect(RequestValidator.validate(p, {})).to.be.empty
  })

  it('should not validate an invalid search path', () => {
  let reqParam = '\\\\test/inv%%alid/path/1/2/345aa'
    chai.expect(RequestValidator.validate(reqParam, {})).to.have.length(1)
    .and.contain('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"')
  })

  it('should validate a valid spatialOp', () => {
    ['within', 'intersects', 'overlaps'].forEach(x => {
      chai.expect(RequestValidator.validate(p, {spatialop: x})).to.be.empty
    })
  })

  it('should not validate an invalid spatialOp', () => {
    chai.expect(RequestValidator.validate(p, {spatialop: 'bobbins'})).to.have.length(1)
    .and.contain('spatialop | should be one of "within", "intersects", "overlaps"')
  })

  it('should validate a valid WKT footprint', () => {
    var footprint = 'POLYGON((-2.2043681144714355 53.692260240428965,-2.203187942504883 53.692260240428965,-2.203187942504883 53.691726603500705,-2.2043681144714355 53.691726603500705,-2.2043681144714355 53.692260240428965))'

    chai.expect(RequestValidator.validate(p, {footprint: footprint})).to.be.empty
  })

  it('should not validate a valid WKT footprint', () => {
    var footprint = 'POLYGON((-2.2043681144714355 53.692260240428965,-2.203187942504883 53.692260240428965,-2.203187942504883 53.691726603500705,-2.2043681144714355 53.691726603500705,-2.2043681144714355))'

    chai.expect(RequestValidator.validate(p, {footprint: footprint})).to.have.length(1)
    .and.contain('footprint | is not valid WKT')
  })

  it('should not validate a valid WKT footprint that is not a closed polygon', () => {
    var footprint = 'POLYGON((-2.2043681144714355 53.692260240428965,-2.203187942504883 53.692260240428965,-2.203187942504883 53.691726603500705,-2.2043681144714355 53.691726603500705))'

    chai.expect(RequestValidator.validate(p, {footprint: footprint})).to.have.length(1)
    .and.contain('footprint | is not a closed polygon')
  })

})

