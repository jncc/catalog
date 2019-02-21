-- Table: public.collection

-- DROP TABLE public.collection;

CREATE TABLE public.collection
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    metadata jsonb NOT NULL,
    footprint geometry(Polygon,4326),
    name character varying(500) COLLATE pg_catalog."default",
    products_schema jsonb,
    CONSTRAINT collection_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

-- Index: collection_id_pkey

-- DROP INDEX public.collection_id_pkey;

CREATE UNIQUE INDEX collection_id_pkey
    ON public.collection USING btree
    (id)
    TABLESPACE pg_default;

-- Index: i_collection_footprint

-- DROP INDEX public.i_collection_footprint;

CREATE INDEX i_collection_footprint
    ON public.collection USING gist
    (footprint)
    TABLESPACE pg_default;

-- Index: i_collection_name_unique_and_pattern

-- DROP INDEX public.i_collection_name_unique_and_pattern;

CREATE UNIQUE INDEX i_collection_name_unique_and_pattern
    ON public.collection USING btree
    (name COLLATE pg_catalog."default" varchar_pattern_ops)
    TABLESPACE pg_default;

ALTER TABLE public.collection
    CLUSTER ON i_collection_name_unique_and_pattern;
