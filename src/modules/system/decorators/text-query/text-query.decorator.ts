import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { TextMessageOLD } from '../../messages/text-old/text.messages.enum';
import { textQueryTransformer } from './transformer/text-query/text-query-transformer';

export function TextQuery() {
  const decorators = applyDecorators(
    IsString({ message: TextMessageOLD.INVALID }),
    IsOptional(),
    Transform(({ value }) => textQueryTransformer(value)),
    Expose,
  );
  return decorators;
}
