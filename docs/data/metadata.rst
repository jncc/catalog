.. _metadata_schema:

Gemini Metadata Schema
**********************

Metadata is stored in the `Gemini standard <http://www.agi.org.uk/agi-groups/standards-committee/uk-gemini>`_. The implementation of which is yet to be finalised.

This schema should be considered work in progress.

..  title: string;
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

.. Metadata keywords
.. =================

..  value: string;
  vocab: string;

.. Responsible Party
.. =================

..  name: string;
  email: string;
  role: string;

.. Extent
.. ======

..  value: string;
  authority: string;

.. BoundingBox
.. ===========

..  north: number;
  south: number;
  east: number;
  west: number;


