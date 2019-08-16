import * as ajv from "ajv";
import * as ajvasync from "ajv-async";

import { DateValidator } from "../validation/dateValidator";

// Test reqs
import "mocha";
import "mocha-inline";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as TypeMoq from "typemoq";
import { Fixtures } from "../test/fixtures";
import { ProductValidator } from "../validation/productValidator";

export function getValidator(schemaVersion:String = "", options: any = { allErrors: true, formats: "full" }) {
  // Fix for mixed json schema versions, older schemas need some extra bits
  let metaSchemaVersion = 7;

  if (schemaVersion == "http://json-schema.org/draft-04/schema#") {
    options.schemaId = 'id';
    metaSchemaVersion = 4
  } else if (schemaVersion == "http://json-schema.org/draft-06/schema#") {
    metaSchemaVersion = 6
  }

  let validator = ajv(options);

  // Fix for mixed json schema versions, older schemas need some extra bits
  if (metaSchemaVersion == 4) {
    validator.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
  } else if (metaSchemaVersion == 6) {
    validator.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
  }

  validator.addKeyword("fullDateValidation", {
    type: "string",
    errors: true,
    validate: (schema, data) => {
      // todo: Get real errors into avj error list.
      let errors: string[] = [];
      DateValidator.validateDate(data, "", errors);

      if (errors.length > 0) {
        return false;
      } else {
        return true;
      }
    }
  });

  return ajvasync(validator);
}

// Tests
// Test setup
// tslint:disable-next-line:no-var-requires
// chai.use(chaiAsPromised);

// describe("Legacy json schema spec support", () => {
//   it("should support draft-04 spec schemas", () => {
//     let mockRepo = Fixtures.GetMockRepo(4);
//     let validator = new ProductValidator(mockRepo.object);
//     return chai.expect(validator.validate(Fixtures.GetTestProduct()))
//       .to.be.fulfilled
//       .and.eventually.be.an("array").that.is.empty;
//   });

//   it("should support draft-06 spec schemas", () => {
//     let mockRepo = Fixtures.GetMockRepo(6);
//     let validator = new ProductValidator(mockRepo.object);
//     return chai.expect(validator.validate(Fixtures.GetTestProduct()))
//       .to.be.fulfilled
//       .and.eventually.be.an("array").that.is.empty;
//   });
// });
