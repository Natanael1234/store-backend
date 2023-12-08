import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ImagesMetadata } from '../../../../system/decorators/images-metadata/images-metadata.decorator';
import { SaveMetadataItemDto } from '../../../../system/dtos/save-metadata-item/save-metadata-item.dto';

export class SaveFileAdditionalDataRequestDTO {
  @ValidateNested()
  @Type(() => SaveMetadataItemDto)
  @ImagesMetadata()
  metadata?: SaveMetadataItemDto[];
}
