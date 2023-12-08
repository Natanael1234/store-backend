import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CloudStorageService } from '../../../../system/cloud-storage/services/cloud-storage/cloud-storage.service';
import { SortConstants } from '../../../../system/constants/sort/sort.constants';
import { SaveImageItemDto } from '../../../../system/dtos/save-image-item-dto/save-image-item.dto';
import { ImageService } from '../../../../system/image/services/image-file/image-file.service';
import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { FileMessage } from '../../../../system/messages/file/file.messages.enum';
import { ImageMessage } from '../../../../system/messages/image/image.messages.enum';
import { MutuallyExclusiveFieldsMessage } from '../../../../system/messages/mutually-exclusive-fields/mutually-exclusive-fields.messages';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { isMulterFile } from '../../../../system/utils/validation/multer-file/is-valid-multer-file-fn';
import { isValidUUID } from '../../../../system/utils/validation/uuid/is-valid-uuid-fn';
import { ProductConstants } from '../../../product/constants/product/product-entity.constants';
import { ProductMessage } from '../../../product/messages/product/product.messages.enum';
import { Product } from '../../../product/models/product/product.entity';
import { ProductImageConfigs } from '../../configs/product-image/product-image.configs';
import { ProductImageConstants } from '../../constants/product-image/product-image-entity.constants';
import { ProductImage } from '../../models/product-image/product-image.entity';

const ProductIdMessage = new UuidMessage('product id');
const ProductImageIdMessage = new UuidMessage('product image id');
const NameMessage = new TextMessage('name', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});
const DescriptionMessage = new TextMessage('description', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});
const MainMessage = new BoolMessage('main');
const ActiveMessage = new BoolMessage('active');
const DeleteMessage = new BoolMessage('delete');
const ImageIdMessage = new UuidMessage('image id');
const ExclusiveImageIdMessage = new MutuallyExclusiveFieldsMessage(
  'imageId',
  'file',
);
const ExclusiveFileMessage = new MutuallyExclusiveFieldsMessage(
  'file',
  'imageId',
);

@Injectable()
export class ProductImageService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private productImageRepo: Repository<ProductImage>,
    private readonly cloudStorageService: CloudStorageService,
    private readonly imageService: ImageService,
  ) {}

  private async validateImageData(imageDataArr: SaveImageItemDto[]) {
    // image data
    if (imageDataArr == null) {
      throw new UnprocessableEntityException(
        ImageMessage.IMAGE_LIST_NOT_DEFINED,
      );
    }
    if (!Array.isArray(imageDataArr)) {
      throw new UnprocessableEntityException(ImageMessage.IMAGE_LIST_INVALID);
    }
    if (!imageDataArr.length) {
      throw new UnprocessableEntityException(ImageMessage.IMAGE_LIST_EMPTY);
    }
    let mainCount = 0;
    for (const imageDataItem of imageDataArr) {
      // item
      if (imageDataItem == null) {
        throw new UnprocessableEntityException(
          ImageMessage.IMAGE_ITEM_NOT_DEFINED,
        );
      }
      if (typeof imageDataItem != 'object' || Array.isArray(imageDataItem)) {
        throw new UnprocessableEntityException(ImageMessage.IMAGE_ITEM_INVALID);
      }

      // name
      if (imageDataItem.name != null) {
        if (typeof imageDataItem.name != 'string') {
          throw new UnprocessableEntityException(NameMessage.INVALID);
        }
        if (imageDataItem.name.length > ProductImageConfigs.NAME_MAX_LENGTH) {
          throw new UnprocessableEntityException(NameMessage.MAX_LEN);
        }
      }

      // description
      if (imageDataItem.description != null) {
        if (typeof imageDataItem.description != 'string') {
          throw new UnprocessableEntityException(DescriptionMessage.INVALID);
        }
        if (
          imageDataItem.description.length >
          ProductImageConfigs.DESCRIPTION_MAX_LENGTH
        ) {
          throw new UnprocessableEntityException(DescriptionMessage.MAX_LEN);
        }
      }

      // main
      if (imageDataItem.main !== undefined) {
        if (imageDataItem.main == null) {
          throw new UnprocessableEntityException(MainMessage.NULL);
        }
        if (typeof imageDataItem.main != 'boolean') {
          throw new UnprocessableEntityException(MainMessage.INVALID);
        }
        if (imageDataItem.main) {
          mainCount++;
          if (mainCount > 1) {
            throw new UnprocessableEntityException(ImageMessage.MULTIPLE_MAINS);
          }
        }
      }

      // active
      if (imageDataItem.active !== undefined) {
        if (imageDataItem.active == null) {
          throw new UnprocessableEntityException(ActiveMessage.NULL);
        }
        if (typeof imageDataItem.active != 'boolean') {
          throw new UnprocessableEntityException(ActiveMessage.INVALID);
        }
      }

      // delete
      if (imageDataItem.delete !== undefined) {
        if (imageDataItem.delete == null) {
          throw new UnprocessableEntityException(DeleteMessage.NULL);
        }
        if (typeof imageDataItem.delete != 'boolean') {
          throw new UnprocessableEntityException(DeleteMessage.INVALID);
        }
      }

      // imageId
      if (imageDataItem.imageId !== undefined) {
        if (
          imageDataItem.imageId != null &&
          !isValidUUID(imageDataItem.imageId)
        ) {
          throw new UnprocessableEntityException(ImageIdMessage.INVALID);
        }
      }

      // file
      if (imageDataItem.file !== undefined) {
        if (imageDataItem.imageId != null && isMulterFile(imageDataItem.file)) {
          throw new UnprocessableEntityException(FileMessage.INVALID_FILE);
        }
      }

      // imageId and file
      if (imageDataItem.imageId != null && imageDataItem.file != null) {
        throw new UnprocessableEntityException(
          ExclusiveFileMessage.BOTH_DEFINED,
        );
      }
      if (imageDataItem.imageId == null && imageDataItem.file == null) {
        throw new UnprocessableEntityException(
          ExclusiveFileMessage.NONE_DEFINED,
        );
      }
    }

    // repeated image ids
    const imageIds = imageDataArr
      .filter((imageDataItem) => imageDataItem.imageId != null)
      .map((imageDataItem) => imageDataItem.imageId);
    const nonRepeatedImageIds = [...new Set(imageIds)];
    if (imageIds.length != nonRepeatedImageIds.length) {
      throw new UnprocessableEntityException(ImageMessage.IMAGE_ID_DUPLICATED);
    }
  }

  /**
   * Upload images of a product and generate thumbnails.
   * Create image registes in the database.
   * Stores image files in cloud storage.
   * @param productId product id.
   * @param imageFiles images files data.
   * @param additionalDataDto additional image data.
   * @returns created product images registers.
   */
  async bulkSave(
    productId: string,
    imageDataArr: SaveImageItemDto[],
  ): Promise<ProductImage[]> {
    // product id
    if (!productId)
      throw new UnprocessableEntityException(ProductIdMessage.REQUIRED);
    if (!isValidUUID(productId)) {
      throw new UnprocessableEntityException(ProductIdMessage.INVALID);
    }

    await this.validateImageData(imageDataArr);

    // product
    const product = await this.productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGES,
      )
      .where(ProductConstants.PRODUCT_ID_EQUALS_TO, { productId })
      .getOne();

    // if product not found
    if (!product) {
      throw new NotFoundException(ProductMessage.NOT_FOUND);
    }

    // max number of images
    let currentCount = product.images.length;
    this.validateImageDataCount(currentCount, imageDataArr);

    // create files in storage
    for (const imageDataItem of imageDataArr) {
      // TODO: add transactions (database and storage). Should not keep images in storage if failed to save in the database.

      // if creating new image
      if (imageDataItem.file) {
        // images in storage
        const imageId = uuidv4();

        // file extension
        const extension = this.imageService.extractFilenameExtension(
          imageDataItem.file.originalname,
        );

        // file state
        const state = imageDataItem.delete
          ? 'deleted'
          : imageDataItem.active
          ? 'public'
          : 'private';

        // file path
        const imagePath = this.getProductImagesPath(
          state,
          productId,
          imageId,
          extension,
          false,
        );

        // thumbnail path
        const thumbnailPath = this.getProductImagesPath(
          state,
          productId,
          imageId,
          'jpeg',
          true,
        );

        // save the image
        await this.cloudStorageService.save(imageDataItem.file, imagePath);

        // thumbnail in storage
        const thumbnailFile = await this.imageService.generateThumbnail(
          imageDataItem.file,
        );

        // save the thumbnail in storage
        await this.cloudStorageService.save(thumbnailFile, thumbnailPath);

        // add image to save in database
        const productImage = new ProductImage();
        productImage.productId = productId;

        // id
        productImage.id = imageId;

        // name
        if (imageDataItem.name !== undefined) {
          productImage.name = imageDataItem.name;
        }

        // description
        if (imageDataItem.description !== undefined) {
          productImage.description = imageDataItem.description;
        }

        // image
        productImage.image = imagePath;

        // thumbnail
        productImage.thumbnail = thumbnailPath;

        // main
        productImage.main = !!imageDataItem.main;

        // active
        productImage.active = !!imageDataItem.active;

        // delete
        if (imageDataItem.delete === true) {
          productImage.deletedAt = new Date();
        }

        product.images.push(productImage);
      }

      // if updating image
      else {
        // image
        const productImage = product.images.find(
          (image) => image.id == imageDataItem.imageId,
        );
        if (!productImage) {
          throw new NotFoundException(ImageMessage.IMAGE_NOT_FOUND);
        }

        // name
        if (
          imageDataItem.name !== undefined &&
          imageDataItem.name != productImage.name
        ) {
          productImage.name = imageDataItem.name;
        }

        // description
        if (
          imageDataItem.description !== undefined &&
          imageDataItem.description != productImage.description
        ) {
          productImage.description = imageDataItem.description;
        }

        // main
        if (
          imageDataItem.main !== undefined &&
          imageDataItem.main != productImage.main
        ) {
          productImage.main = imageDataItem.main;
        }

        let changedState = false;

        // active
        if (
          imageDataItem.active !== undefined &&
          imageDataItem.active != productImage.active
        ) {
          changedState = true;
          productImage.active = !!imageDataItem.active;
        }

        // delete
        if (
          imageDataItem.delete !== undefined &&
          imageDataItem.delete != !!productImage.deletedAt
        ) {
          changedState = true;
          productImage.deletedAt = new Date();
        }

        // change visibility of image file and thumbnail according active or deleted register state by moving to or from private folders
        if (changedState) {
          let state;
          if (productImage.deletedAt) {
            state = 'deleted';
          } else if (productImage.active) {
            state = 'public';
          } else {
            state = 'private';
          }
          const extension = this.imageService.extractFilenameExtension(
            productImage.image,
          );
          const oldImagePath = productImage.image;
          const oldThumbnailPath = productImage.thumbnail;
          productImage.image = this.getProductImagesPath(
            state,
            productImage.productId,
            productImage.id,
            extension,
            false,
          );
          productImage.thumbnail = this.getProductImagesPath(
            state,
            productImage.productId,
            productImage.id,
            'jpeg',
            true,
          );
          this.cloudStorageService.move(productImage.image, oldImagePath);
          this.cloudStorageService.move(
            productImage.thumbnail,
            oldThumbnailPath,
          );
        }
      }
    }

    // save images in database
    await this.productImageRepo.save(product.images);

    const images = await this.productImageRepo
      .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
      .where(ProductImageConstants.PRODUCT_IMAGE_PRODUCT_ID_EQUALS_TO, {
        productId: productId,
      })
      .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
      .addOrderBy(ProductImageConstants.PRODUCT_IMAGE_ACTIVE, SortConstants.ASC)
      .getMany();

    return images;
  }

  private validateImageDataCount(
    currentCount: number,
    imageDataArr: SaveImageItemDto[],
  ) {
    const creationCount = imageDataArr.filter(
      (imageDataItem) => imageDataItem.file != null,
    ).length;
    const deleteCount = imageDataArr.filter(
      (imageDataItem) => imageDataItem.delete,
    ).length;
    let count = currentCount + creationCount - deleteCount;
    // check if reached maximum number of images
    if (count > ProductImageConfigs.MAX_IMAGE_COUNT) {
      throw new BadRequestException(
        `Maximum number of images reached. A product can have a maximum of ${ProductImageConfigs.MAX_IMAGE_COUNT} images`, // TODO: move to class
      );
    }
  }

  private getProductImagesPath(
    state: 'public' | 'deleted' | 'private' = 'private',
    productId: string,
    imageId: string,
    fileExtension: string,
    isThumbnail: boolean = false,
  ) {
    if (!productId) {
      throw new UnprocessableEntityException(ProductIdMessage.REQUIRED);
    }
    if (!isValidUUID(productId)) {
      throw new UnprocessableEntityException(ProductIdMessage.INVALID);
    }
    if (!imageId) {
      throw new UnprocessableEntityException(ProductImageIdMessage.REQUIRED);
    }
    if (!isValidUUID(imageId)) {
      throw new UnprocessableEntityException(ProductImageIdMessage.INVALID);
    }
    const directory = `/${state}/products/${productId}/images`;
    const filename =
      imageId +
      (isThumbnail ? '.thumbnail' : '') +
      (fileExtension ? '.' + fileExtension : '');
    const objectpath = `${directory}/${filename}`;
    return objectpath;
  }
}
