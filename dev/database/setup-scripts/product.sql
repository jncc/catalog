-- Table: public.product

-- DROP TABLE public.product;

CREATE TABLE public.product
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    collection_id uuid NOT NULL,
    metadata jsonb NOT NULL,
    properties jsonb,
    data jsonb,
    footprint geometry(MultiPolygon,4326),
    name character varying(500) COLLATE pg_catalog."default",
    CONSTRAINT product_pkey PRIMARY KEY (id),
    CONSTRAINT constraint_product_collection_id_name_unique UNIQUE (collection_id, name)
,
    CONSTRAINT collection_id_fkey FOREIGN KEY (collection_id)
        REFERENCES public.collection (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

-- Index: fki_collection_id_fkey

-- DROP INDEX public.fki_collection_id_fkey;

CREATE INDEX fki_collection_id_fkey
    ON public.product USING btree
    (collection_id)
    TABLESPACE pg_default;

-- Index: i_product_footprint

-- DROP INDEX public.i_product_footprint;

CREATE INDEX i_product_footprint
    ON public.product USING gist
    (footprint)
    TABLESPACE pg_default;

-- Index: i_product_name_unique_and_pattern

-- DROP INDEX public.i_product_name_unique_and_pattern;

CREATE UNIQUE INDEX i_product_name_unique_and_pattern
    ON public.product USING btree
    (id, name COLLATE pg_catalog."default" varchar_pattern_ops)
    TABLESPACE pg_default;

ALTER TABLE public.product
    CLUSTER ON i_product_name_unique_and_pattern;
