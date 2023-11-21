import { ImagesMetadata } from '../../../../system/decorators/images-metadata/images-metadata.decorator';
import { SaveFileMetadataDto } from '../../../../system/decorators/images-metadata/save-file-metadata.dto';

export class SaveFileAdditionalDataRequestDTO {
  @ImagesMetadata()
  metadatas?: SaveFileMetadataDto[];
}
