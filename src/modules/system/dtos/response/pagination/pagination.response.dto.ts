export class PaginatedResponseDTO<T, O> {
  constructor(
    /**
     * Formated text query.
     */
    public readonly textQuery: string,

    /**
     * Total number of results in all pages.
     *
     * @example 15.
     */
    public readonly count: number,

    /**
     * Page. Default 1.
     * @example 1
     */

    public readonly page: number,

    /**
     * Page size. Default 12.
     *
     * @example 12
     */
    public readonly pageSize: number,

    /**
     * Order by.
     */
    public readonly orderBy: O[],

    /** Results. */
    public readonly results: T[],
  ) {}
}
