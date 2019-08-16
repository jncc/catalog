import { ICollection } from "../definitions/collection/collection";
import { IProduct } from "../definitions/product/product";

import * as chai from "chai";
import * as fs from "fs";
import "mocha";
import "mocha-inline";
import * as TypeMoq from "typemoq";

export class Fixtures {
  // public static GetTestProduct(): IProduct {
  //   let content = fs.readFileSync("./api/test/product.json", "utf8");
  //   return JSON.parse(content);
  // }

  // public static GetTestPropertySchema(): any {
  //   let content = fs.readFileSync("./api/test/collectionSchema.json", "utf8");
  //   return JSON.parse(content);
  // }

  // public static GetV4TestPropertySchema(): any {
  //   let content = fs.readFileSync("./api/test/collectionSchema.v4.json", "utf8");
  //   return JSON.parse(content);
  // }

  // public static GetV6TestPropertySchema(): any {
  //   let content = fs.readFileSync("./api/test/collectionSchema.v6.json", "utf8");
  //   return JSON.parse(content);
  // }

  // public static GetFootprint(): any {
  //   return {
  //     type: "MultiPolygon",
  //     coordinates: [[[
  //       [-3.252708444643698, 55.01808601299337],
  //       [-3.096345813599173, 55.01959554822891],
  //       [-3.098805121795129, 55.1094396249146],
  //       [-3.25551820944467, 55.10792506925024],
  //       [-3.252708444643698, 55.01808601299337]
  //     ]]],
  //     crs: {
  //       properties: {
  //         name: "urn:ogc:def:crs:OGC:1.3:CRS84"
  //       },
  //       type: "name"
  //     }
  //   };
  // }

  // public static GetCollection(): ICollection {
  //   return {
  //     id: "3bfc0280-5708-40ee-aef4-df3ddeb4fd21",
  //     name: "test/collection",
  //     metadata: this.GetTestProduct().metadata,
  //     footprint: this.GetTestProduct().footprint,
  //     productsSchema: this.GetTestPropertySchema()
  //   };
  // }

  // public static GetCollectionV4(): ICollection {
  //   return {
  //     id: "3bfc0280-5708-40ee-aef4-df3ddeb4fd21",
  //     name: "test/collection",
  //     metadata: this.GetTestProduct().metadata,
  //     footprint: this.GetTestProduct().footprint,
  //     productsSchema: this.GetV4TestPropertySchema()
  //   };
  // }

  // public static GetCollectionV6(): ICollection {
  //   return {
  //     id: "3bfc0280-5708-40ee-aef4-df3ddeb4fd21",
  //     name: "test/collection",
  //     metadata: this.GetTestProduct().metadata,
  //     footprint: this.GetTestProduct().footprint,
  //     productsSchema: this.GetV6TestPropertySchema()
  //   };
  // }

  // public static GetMockRepo(version:number = 7): TypeMoq.IMock<CatalogRepository> {
  //   let mockRepo = TypeMoq.Mock.ofType(CatalogRepository);

  //   mockRepo.setup((x) => x.checkCollectionNameExists(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns((x, y) => {
  //     return Promise.resolve(x);
  //   });
  //   if (version == 4) {
  //     mockRepo.setup((x) => x.getCollections(TypeMoq.It.isAny(), TypeMoq.It.isAnyNumber(), TypeMoq.It.isAnyNumber()))
  //       .returns((x, y) => {
  //         let c: ICollection = Fixtures.GetCollectionV4();
  //         return Promise.resolve([c]);
  //     });
  //   } else if (version == 6) {
  //     mockRepo.setup((x) => x.getCollections(TypeMoq.It.isAny(), TypeMoq.It.isAnyNumber(), TypeMoq.It.isAnyNumber()))
  //       .returns((x, y) => {
  //         let c: ICollection = Fixtures.GetCollectionV6();
  //         return Promise.resolve([c]);
  //     });
  //   } else {
  //     mockRepo.setup((x) => x.getCollections(TypeMoq.It.isAny(), TypeMoq.It.isAnyNumber(), TypeMoq.It.isAnyNumber()))
  //       .returns((x, y) => {
  //         let c: ICollection = Fixtures.GetCollection();
  //         return Promise.resolve([c]);
  //     });
  //   }
  //   mockRepo.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
  //     let c: ICollection = Fixtures.GetCollection();
  //     return Promise.resolve(c);
  //   });
  //   mockRepo.setup((x) => x.getProducts(TypeMoq.It.isAny()))
  //     .returns((x, y) => {
  //       let p: IProduct = Fixtures.GetTestProduct();
  //       return Promise.resolve([p]);
  //   });
  //   mockRepo.setup((x) => x.storeProduct(TypeMoq.It.isAny())).returns((x, y) => {
  //     return Promise.resolve(Fixtures.GetTestProduct().id);
  //   });

  //   return mockRepo;
  // }
}

// describe("Test fixtures", () => {
//   it("GetTestProduct should return the product from ./api/test/product.json", () => {
//     const result = Fixtures.GetTestProduct();
//     chai.expect(result.id).to.equal("cdc1c5c4-0940-457e-8583-e1cd45b0a5a3");
//   });
// });
