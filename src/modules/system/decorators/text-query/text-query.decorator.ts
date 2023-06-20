import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { TextMessage } from '../../enums/messages/text-messages/text-messages.enum';
import { textSearchTransformer } from '../../utils/text-seach/text-search-transformer';

export function TextQuery() {
  const decorators = applyDecorators(
    IsString({ message: TextMessage.STRING }),
    IsOptional(),
    Transform(({ value }) => textSearchTransformer(value)),
    Expose,
  );
  return decorators;
}
