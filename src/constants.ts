export enum QueryParams {
  QUERY = 'q',
  PAGE = 'page',
  LIMIT = 'limit',
  CATEGORY = 'category',
  COUNTRY = 'country',
  LANGUAGE = 'language',
  TYPE = 'type',
  ID = 'id',
  SUBTITLE = 'subtitle',
}

export enum FilterValues {
  ALL = 'all',
}

export enum MetadataTypes {
  CATEGORY = 'category',
  COUNTRY = 'country',
  LANGUAGE = 'language',
}

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  PUBLIC_LIMIT: 15,
  CATEGORY_LIMIT: 12,
};
