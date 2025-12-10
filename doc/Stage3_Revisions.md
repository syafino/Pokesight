Changes Made:
Additional Indexing for Sighting(latitude), Sighting(longitude), and Pokemon(pokemon_name)
- Longitude and Latitude applicable to all 4 queries as it is used in all 4 queries' where clauses.
- pokemon_name applicable to query 4 as it is used in the select clause

This is to address these comments:

-COMMENT 1: Query 1 indexes on maxCP, base_attack which don't appear in query
  -REVISION: Longitude and Latitude indexes do appear in query 1
  
-COMMENT 2: Query 2 indexes on maxCP, base_attack which don't appear in query
  -REVISION: Longitude and Latitude indexes do appear in query 2

-COMMENT 3: Query 4 indexes on the attributes which don't appear in query
  -REVISION: Longitude, Latitude and pokemon_name indexes do appear in query 4
