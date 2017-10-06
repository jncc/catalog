import * as chai from "chai";
import "mocha";
import "mocha-inline";

//todo: get rid of this
require("mocha-inline")();

export class DateValidator {
  public static validateDate(dateString: string, fieldName: string, errors: string[]): boolean {
    let isValid = true;
    if (!dateString.match(/^\b[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}(:[0-9]{2})?Z)?$/)) {
      errors.push(fieldName + " | is not a valid date time format");
      isValid = false;
    } else {

      if (!Date.parse(dateString)) {
        errors.push(fieldName + " | is not a valid date");
        isValid = false;
      } else {
        let date = new Date(dateString);
        let dateParts = dateString.split("T");
        if (!this.validateDatePart(dateParts[0], date, fieldName, errors)) {
          isValid = false;
        }
      }
    }
    return isValid;
  }

  private static validateDatePart(datePart: string, date: Date, fieldName: string, errors: string[]): boolean {
    let isValid = true;
    let elements = datePart.split("-");
    if (+elements[0] !== date.getUTCFullYear() ||
      +elements[1] !== date.getUTCMonth() + 1 ||
      +elements[2] !== date.getUTCDate()) {

      errors.push(fieldName + " | is not a valid date");
      isValid = false;
    }
    return isValid;
  }
}

describe("Date Validator", () => {

  it("should validate a valid date", () => {
    ["2014-01-04",
    "2014-01-05T06:34:23Z",
    "2014-01-05T01:02Z"].forEach((x) => {
      let errors: string[] = [];
      DateValidator.validateDate(x, "test", errors);
      chai.expect(errors).to.be.empty;
    });
  });

  it("should not validate an improperly formated date", () => {

    ["01012012, 01-01-2012T01,01-01-2012T0102Z", "01-012012T01:0203"].forEach((x) => {
      let errors: string[] = [];
      DateValidator.validateDate(x, "test", errors);
      chai.expect(errors).to.have.length(1).and.contain("test | is not a valid date time format");
    });

  });

  it("should not validate an invalid date", () => {
    ["2015-02-29", "2015-16-16", "2015-02-31"].forEach((x) => {
      let errors: string[] = [];
      DateValidator.validateDate(x, "test", errors);
      chai.expect(errors).to.have.length(1).and.contain("test | is not a valid date");
    });
  });

});
