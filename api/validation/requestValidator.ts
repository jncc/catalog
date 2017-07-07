import * as wellknown from "wellknown"
import * as geojson from "geojson"
import { DateValidator } from "./dateValidator"

//test reqs
import 'mocha';
import * as chai from 'chai';

require('mocha-inline')();

export class RequestValidator {
  static validate(reqParam: string, queryParams): string[] {
    let errors: string[] = []
    let Dates = {}

    this.validateRequestParameter(reqParam, errors)
    for (let parameter in queryParams) {
      if (parameter === 'footprint') {
        this.validateFootprint(queryParams[parameter], errors);
      } else if (parameter === 'spatialop') {
        this.validateSpatialOp(queryParams[parameter], errors);
      } else if (parameter === 'fromCaptureDate' || parameter === 'toCaptureDate') {
        if (DateValidator.validateDate(parameter, queryParams[parameter], errors)) {
          Dates[parameter] = new Date(queryParams[parameter])
        }
      }
    };
    return errors;
  }

  private static validateRequestParameter(requestParameter: string, errors: string[]) {
    if (!requestParameter.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)) {
      errors.push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"')
    }

  }

  private static validateFootprint(param: string, errors: string[]) {
    let footprint = <geojson.Polygon>wellknown.parse(param)
    if (!footprint) {
      errors.push('footprint | is not valid WKT')
    } else {
      let firstCoord = footprint.coordinates[0][0]
      let lastCoord = footprint.coordinates[0][footprint.coordinates[0].length - 1]
      if (!firstCoord.every((element, index) => {return element === lastCoord[index]})) {
        errors.push('footprint | is not a closed polygon')
      }
    }
  }

  private static validateSpatialOp(param: string, errors: string[]) {
    if (!['within', 'intersects', 'overlaps'].find(val => val === param)) {
      errors.push('spatialop | should be one of "within", "intersects", "overlaps"')
    }
  }

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
      chai.expect(RequestValidator.validate(p, { spatialop: x })).to.be.empty
    })
  })

  it('should not validate an invalid spatialOp', () => {
    chai.expect(RequestValidator.validate(p, { spatialop: 'bobbins' })).to.have.length(1)
      .and.contain('spatialop | should be one of "within", "intersects", "overlaps"')
  })

  it('should validate a valid WKT footprint', () => {
    var footprint = 'POLYGON((-2.2043681144714355 53.692260240428965,-2.203187942504883 53.692260240428965,-2.203187942504883 53.691726603500705,-2.2043681144714355 53.691726603500705,-2.2043681144714355 53.692260240428965))'

    chai.expect(RequestValidator.validate(p, { footprint: footprint })).to.be.empty
  })

  it('should not validate an ivalid WKT footprint', () => {
    var footprint = 'POLYGON((-2.2043681144714355 53.692260240428965,-2.203187942504883 53.692260240428965,-2.203187942504883 53.691726603500705,-2.2043681144714355 53.691726603500705,-2.2043681144714355))'

    chai.expect(RequestValidator.validate(p, { footprint: footprint })).to.have.length(1)
      .and.contain('footprint | is not valid WKT')
  })

  it('should not validate a WKT footprint that is not a closed polygon', () => {
    var footprint = 'POLYGON((-2.2043681144714355 53.692260240428965,-2.203187942504883 53.692260240428965,-2.203187942504883 53.691726603500705,-2.2043681144714355 53.691726603500705))'

    chai.expect(RequestValidator.validate(p, { footprint: footprint })).to.have.length(1)
      .and.contain('footprint | is not a closed polygon')
  })

  it('should validate a valid fromCaptureDate', () => {
    ['2014-01-04',
    '2014-01-05T06:34:23Z'].forEach(x => {
      chai.expect(RequestValidator.validate(p, { fromCaptureDate: x })).to.be.empty
    })
  })

  it('should not validate and improperly formated capture date', () => {
    chai.expect(RequestValidator.validate(p, { fromCaptureDate: '01-01-2012' })).to.have.length(1).and.contain('fromCaptureDate | is not a valid utc date time format')
  })

  it('should not validate an invalid date', () => {
    chai.expect(RequestValidator.validate(p, { fromCaptureDate: '2015-02-29' })).to.have.length(1).and.contain('fromCaptureDate | is not a valid date')
  })

})

