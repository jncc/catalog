import { Request } from "express"

//test reqs
import 'mocha';
import * as chai from 'chai';

require('mocha-inline')();

export class RequestValidator {
  static validate(reqParam: string, queryParams): string[] {
    let errors: string[] = []

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

  private static validateFootprint(param: string, errors: string[] ) {}
  private static validateSpatialOp(param: string, errors: string[] ) {
    if (!['within', 'intersects', 'overlaps'].find(val => val === param)) {
      errors.push('spatialOp | should be one of "within", "intersects", "overlaps"')
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
  let reqParam = 'test/v%%alid/path/1/2/345aa'
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
    .and.contain('spatialOp | should be one of "within", "intersects", "overlaps"')
  })
})

