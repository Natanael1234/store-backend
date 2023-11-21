import {
  Body,
  Controller,
  Param,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '../../../../authentication/enums/role/role.enum';
import { getImageFilesInterceptor } from '../../../../system/cloud-storage/services/cloud-storage/image-upload-utils';
import { UuidValidationPipe } from '../../../../system/pipes/uuid/uuid-validation.pipe';
import { Roles } from '../../../../user/decorators/roles/roles.decorator';
import { SaveFileAdditionalDataRequestDTO } from '../../dtos/save-file-additional-data/save-file-additional-data.request.dto';
import { ProductImage } from '../../models/product-image/product-image.entity';
import { ProductImageService } from '../../services/product-image/product-image.service';

@Controller('product-image')
export class ProductImageController {
  constructor(private productImageService: ProductImageService) {}

  // product images
  @Put('/:productId/images/bulk')
  @Roles(Role.ROOT, Role.ADMIN)
  @UseInterceptors(getImageFilesInterceptor())
  bulkSave(
    @Param('productId', new UuidValidationPipe('product id')) productId: string,
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() dto: SaveFileAdditionalDataRequestDTO,
  ): Promise<ProductImage[]> {
    return this.productImageService.bulkSave(productId, images, dto);
  }
}
