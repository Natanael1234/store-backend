import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ActiveFilter } from '../../../enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../enums/filter/deleted-filter/deleted-filter.enum';
import { ActiveMessage } from '../../../enums/messages/active-messages/active-messages.enum';
import { DeletedMessage } from '../../../enums/messages/deleted-messages/deleted-messages.enum';
import { TextMessage } from '../../../enums/messages/text-messages/text-messages.enum';

export class FilteringRequestDTO {
  @IsString({ message: TextMessage.STRING })
  @IsOptional()
  @Transform((options) => {
    if (typeof options.value == 'string') {
      const stringWithoutDuplicateSpaces = options.value.replace(/\s+/g, ' ');
      const trimmedString = stringWithoutDuplicateSpaces.trim();
      return trimmedString;
    }
    return options.value;
  })
  @Expose()
  query?: string;

  @IsEnum(ActiveFilter, { message: ActiveMessage.INVALID })
  @Transform((options) => {
    if (options.value == null) {
      return ActiveFilter.ACTIVE;
    } else if (options.value == ActiveFilter.ACTIVE) {
      return ActiveFilter.ACTIVE;
    } else if (options.value == ActiveFilter.INACTIVE) {
      return ActiveFilter.INACTIVE;
    } else if (options.value == ActiveFilter.ALL) {
      return ActiveFilter.ALL;
    }
    return options.value;
  })
  @Expose()
  active?: ActiveFilter;

  @IsEnum(DeletedFilter, { message: DeletedMessage.INVALID })
  @Transform((options) => {
    if (options.value == null) {
      return DeletedFilter.NOT_DELETED;
    } else if (typeof options.value == 'string') {
      const value = options.value.toLowerCase();
    } else if (options.value == DeletedFilter.DELETED) {
      return DeletedFilter.DELETED;
    } else if (options.value == DeletedFilter.NOT_DELETED) {
      return DeletedFilter.NOT_DELETED;
    } else if (options.value == DeletedFilter.ALL) {
      return DeletedFilter.ALL;
    }
    return options.value;
  })
  @Expose()
  deleted?: DeletedFilter;
}
