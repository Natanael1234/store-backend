export class PaginatedResponseDTO<T> {
  constructor(
    public readonly results: T[],
    public readonly count: number,
    public readonly page: number,
    public readonly pageSize: number,
  ) {}
}
