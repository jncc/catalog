-- View: public.product_view

-- DROP VIEW public.product_view;

CREATE OR REPLACE VIEW public.product_view AS
 SELECT p.id,
    c.name AS collection_name,
    p.name,
    (c.name::text || '/'::text) || p.name::text AS full_name,
    c.metadata || p.metadata AS metadata,
    p.properties,
    p.data,
    p.footprint
   FROM product p
     JOIN collection c ON p.collection_id = c.id;
