.. _metadata_schema:

Gemini Metadata Schema
**********************

  title: string;
  abstract: string;
  topicCategory: string;
  keywords: IKeyword[];
  temporalExtent.begin
  temporalExtent.end
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
  boundingBox

Metadata keywords
=================

  value: string;
  vocab: string;

Responsible Party
=================

  name: string;
  email: string;
  role: string;

Extent
======

  value: string;
  authority: string;

export interface IBoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

