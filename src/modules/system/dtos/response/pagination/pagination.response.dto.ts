export class PaginatedResponseDTO<T> {
  constructor(
    /** Results. */
    public readonly results: T[],
    /**
     * Total number of results in all pages
     *
     * @example 15.
     */
    public readonly count: number,
    /**
     * Page. Default 1.
     * @example 1
     */
    public readonly page: number,
    /** Page size. Default 12.
     *
     * @example 12
     */
    public readonly pageSize: number,
  ) {}
}
