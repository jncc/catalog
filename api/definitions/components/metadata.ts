export interface IMetadata {
  title: string;
  abstract: string;
  topicCategory: string;
  keywords: IKeyword[];
  temporalExtent: ITemporalExtent;
  datasetReferenceDate: string;
  lineage: string;
  resourceLocator: string;
  additionalInformationSource: string;
  dataFormat: string;
  responsibleOrganisation: IResponsibleParty;
  limitationsOnPublicAccess: string;
  useConstraints: string;
  spatialReferenceSystem: string;
  extent: IExtent[];
  metadataDate: string;
  metadataPointOfContact: IResponsibleParty;
  resourceType: string;
  boundingBox: IBoundingBox;
}

export interface IKeyword {
  value: string;
  vocab?: string;
}

export interface ITemporalExtent {
  begin: string;
  end: string;
}

export interface IResponsibleParty {
  name: string;
  email: string;
  role: string;
}

export interface IExtent {
  value: string;
  authority: string;
}

export interface IBoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function nonSchemaValidation(metadata, errors) {
  if (metadata.boundingBox.north <= metadata.boundingBox.south) {
    errors.push("metadata.boundingBox | north should be greater than south");
  }
  if (metadata.boundingBox.east <= metadata.boundingBox.west) {
    errors.push("metadata.boundingBox | east should be greater than west");
  }

  return errors;
}

export const Schema = {
  metadata: {
    type: "object",
    properties: {
      title: {
        type: "string",
        minLength: 1
      },
      abstract: {
        type: "string",
        minLength: 1
      },
      topicCategory: {
        type: "string",
        minLength: 1
      },
      keywords: {
        type: "array",
        minItems: 1,
        items: {
          $ref: "#/definitions/metadata/keyword"
        }
      },
      temporalExtent: {
        $ref: "#/definitions/metadata/temporalExtent"
      },
      datasetReferenceDate: {
        type: "string",
        oneOf: [
          { format: "date-time" },
          { format: "date" }
        ],
        fullDateValidation: true
      },
      lineage: {
        type: "string",
        minLength: 1
      },
      resourceLocator: {
        type: "string",
        format: "uri"
      },
      additionalInformationSource: {
        type: "string",
        minLength: 1
      },
      dataFormat: {
        type: "string",
        minLength: 1
      },
      responsibleOrganisation: {
        $ref: "#/definitions/metadata/responsibleOrganisation",
      },
      limitationsOnPublicAccess: {
        type: "string",
        minLength: 1
      },
      useConstraints: {
        type: "string",
        minLength: 1
      },
      spatialReferenceSystem: {
        type: "string",
        minLength: 1
      },
      metadataDate: {
        type: "string",
        oneOf: [
          { format: "date-time" },
          { format: "date" }
        ],
        fullDateValidation: true
      },
      metadataPointOfContact: {
        $ref: "#/definitions/metadata/metadataPointOfContact"
      },
      resourceType: {
        type: "string",
        minLength: "1"
      },
      boundingBox: {
        $ref: "#/definitions/metadata/boundingBox"
      }
    },
    required: ["title", "boundingBox"]
  },
  keyword: {
    type: "object",
    properties: {
      value: {
        type: "string",
        minLength: 1
      },
      vocab: {
        type: "string",
        minLength: 1
      }
    },
    required: ["value"]
  },
  temporalExtent: {
    type: "object",
    properties: {
      begin: {
        type: "string",
        format: "date-time",
        fullDateValidation: true
      },
      end: {
        type: "string",
        format: "date-time",
        fullDateValidation: true
      }
    },
    required: ["begin", "end"]
  },
  responsibleOrganisation: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1
      },
      email: {
        type: "string",
        format: "email"
      },
      role: {
        type: "string",
        minLength: 1
      }
    },
    required: ["email"]
  },
  metadataPointOfContact: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1
      },
      email: {
        type: "string",
        format: "email"
      },
      role: {
        type: "string",
        pattern: "^metadataPointOfContact$"
      }
    },
    required: ["name", "email", "role"]
  },
  boundingBox: {
    type: "object",
    properties: {
      north: {
        type: "number",
      },
      south: {
        type: "number",
      },
      east: {
        type: "number",
      },
      west: {
        type: "number",
      }
    },
    required: ["north", "south", "east", "west"]
  }
};
