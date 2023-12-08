import {
  Body,
  Controller,
  Injectable,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '../../../../authentication/enums/role/role.enum';
import { getImageFilesInterceptor } from '../../../../system/cloud-storage/services/cloud-storage/image-upload-utils';
import { ImageMetadataParserInterceptor } from '../../../../system/interceptors/image-metadata-parser/image-metadata-parser.interceptor';
import { imageDataMapper } from '../../../../system/mappers/image-data-mapper';
import { UuidValidationPipe } from '../../../../system/pipes/uuid/uuid-validation.pipe';
import { Roles } from '../../../../user/decorators/roles/roles.decorator';
import { SaveFileAdditionalDataRequestDTO } from '../../dtos/save-file-additional-data/save-file-additional-data.request.dto';
import { ProductImage } from '../../models/product-image/product-image.entity';
import { ProductImageService } from '../../services/product-image/product-image.service';

// TODO: move to another file
@Injectable()
@Controller('product-images')
export class ProductImageController {
  constructor(private productImageService: ProductImageService) {}

  // product images
  @Post('/:productId/images/bulk')
  @Roles(Role.ROOT, Role.ADMIN)
  @UseInterceptors(getImageFilesInterceptor(), ImageMetadataParserInterceptor)
  bulkSave(
    @Param('productId', new UuidValidationPipe('product id')) productId: string,
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() dto: SaveFileAdditionalDataRequestDTO,
  ): Promise<ProductImage[]> {
    const imageDataArr = imageDataMapper(images, dto.metadata);
    return this.productImageService.bulkSave(productId, imageDataArr);
  }
}
