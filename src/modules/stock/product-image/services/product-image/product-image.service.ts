import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CloudStorageService } from '../../../../system/cloud-storage/services/cloud-storage/cloud-storage.service';
import { SortConstants } from '../../../../system/constants/sort/sort.constants';
import { ImagesMetadataMessage } from '../../../../system/decorators/images-metadata/messages/images-metadata/images-metadata.messages.enum';
import { SaveFileMetadataDto } from '../../../../system/decorators/images-metadata/save-file-metadata.dto';
import { ImageService } from '../../../../system/image/services/image-file/image-file.service';
import { FileMessage } from '../../../../system/messages/file/file.messages.enum';
import { ImageMessage } from '../../../../system/messages/image/image.messages.enum';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { isValidUUID } from '../../../../system/utils/validation/is-valid-uuid-fn';
import { validateOrThrowError } from '../../../../system/utils/validation/validation';
import { ProductConstants } from '../../../product/constants/product/product-entity.constants';
import { ProductMessage } from '../../../product/messages/product/product.messages.enum';
import { Product } from '../../../product/models/product/product.entity';
import { ProductImageConfigs } from '../../configs/product-image/product-image.configs';
import { ProductImageConstants } from '../../constants/product-image/product-image-entity.constants';
import { SaveFileAdditionalDataRequestDTO } from '../../dtos/save-file-additional-data/save-file-additional-data.request.dto';
import { ProductImage } from '../../models/product-image/product-image.entity';

const ProductIdMessage = new UuidMessage('product id');
const ProductImageIdMessage = new UuidMessage('product image id');
const NameMessage = new TextMessage('name', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});

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
    imageFiles: Array<Express.Multer.File>,
    additionalDataDto: SaveFileAdditionalDataRequestDTO,
  ): Promise<ProductImage[]> {
    // product id

    if (!productId)
      throw new UnprocessableEntityException(ProductIdMessage.REQUIRED);
    if (!isValidUUID(productId)) {
      throw new UnprocessableEntityException(ProductIdMessage.INVALID);
    }

    // additional data

    if (!additionalDataDto) {
      throw new UnprocessableEntityException('Data is required'); // TODO: move message to enum
    }

    if (!this.isValidAdditionalDataDto(additionalDataDto)) {
      // TODO: maybe I should implements something like this for other dtos
      throw new UnprocessableEntityException(
        ImagesMetadataMessage.ADDITIONAL_DATA_INVALID,
      );
    }
    additionalDataDto = plainToInstance(
      SaveFileAdditionalDataRequestDTO,
      additionalDataDto,
    );
    await validateOrThrowError(
      additionalDataDto,
      SaveFileAdditionalDataRequestDTO,
    );

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

    // checks if both imageFiles and metadata are not defined

    if (!imageFiles?.length && !additionalDataDto?.metadatas?.length) {
      throw new UnprocessableEntityException(
        ImagesMetadataMessage.IMAGE_OR_METADATA_NOT_DEFINED,
      );
    }

    // checks empty image list

    if (imageFiles && !imageFiles.length) {
      throw new UnprocessableEntityException(ImageMessage.IMAGES_EMPTY_LIST);
    }

    // merge images and files

    if (imageFiles) {
      this.mergeImageAndMetadata(imageFiles, additionalDataDto);
    }

    if (!imageFiles) {
      // checks if imageFiles is referenced but is null
      const containsReferenceToImageFiles =
        !!additionalDataDto?.metadatas?.find(
          (metadata) => metadata.imageIdx != null,
        );
      if (containsReferenceToImageFiles) {
        throw new UnprocessableEntityException(ImageMessage.IMAGES_NOT_DEFINED);
      }
    }

    // max number of images

    // count of images starting with existent images

    let count = product.images.length;

    for (const metadata of additionalDataDto.metadatas) {
      // checks if metadata.imageId matches existent image

      if (metadata.imageId) {
        const image = product.images.find((i) => i.id == metadata.imageId);
        if (!image) {
          throw new NotFoundException(ImageMessage.IMAGE_NOT_FOUND);
        }
      }

      // if new image increment image count

      if (!metadata.imageId) {
        count++;
      }

      // if deleting image decrement image count

      if (metadata.delete) {
        count--;
      }
    }

    // check if reached maximum number of images
    if (count > ProductImageConfigs.MAX_IMAGE_COUNT) {
      throw new BadRequestException(
        `Maximum number of images reached. A product can have a maximum of ${ProductImageConfigs.MAX_IMAGE_COUNT} images`, // TODO: move to class
      );
    }

    // create files in storage

    for (const metadata of additionalDataDto.metadatas) {
      // checks if metadata is improperly referencing an missing image in imageFiles while creating

      if (metadata.imageIdx !== undefined && !metadata.file) {
        throw new UnprocessableEntityException(
          ImagesMetadataMessage.IMAGE_IDX_NOT_FOUND,
        );
      }

      // checks if metadata is improperly referencing an image in imageFiles while updating

      if (metadata.imageId && metadata.file) {
        throw new UnprocessableEntityException(
          ImagesMetadataMessage.IMAGE_NOT_ALLOWED,
        );
      }

      // TODO: add transactions (database and storage). Should not keep images in storage if failed to save in the database.

      // if creating new image

      if (metadata.file) {
        // images in storage
        const imageId = uuidv4();

        // file extension
        const extension = this.imageService.extractFilenameExtension(
          metadata.file.originalname,
        );

        // file state
        const state = metadata.delete
          ? 'deleted'
          : metadata.active
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
        await this.cloudStorageService.save(metadata.file, imagePath);

        // thumbnail in storage
        const thumbnailFile = await this.imageService.generateThumbnail(
          metadata.file,
        );

        // save the thumbnail in storage
        await this.cloudStorageService.save(thumbnailFile, thumbnailPath);

        // add image to save in database
        const productImage = new ProductImage();
        productImage.productId = productId;

        // id
        productImage.id = imageId;

        // name
        if (metadata.name !== undefined) {
          productImage.name = metadata.name;
        }

        // description
        if (metadata.description !== undefined) {
          productImage.description = metadata.description;
        }

        // image
        productImage.image = imagePath;

        // thumbnail
        productImage.thumbnail = thumbnailPath;

        // main
        productImage.main = !!metadata.main;

        // active
        productImage.active = !!metadata.active;

        // delete
        if (metadata.delete === true) {
          productImage.deletedAt = new Date();
        }

        product.images.push(productImage);
      }

      // if updating image
      else {
        // image

        const productImage = product.images.find(
          (image) => image.id == metadata.imageId,
        );

        // name
        if (metadata.name !== undefined && metadata.name != productImage.name) {
          productImage.name = metadata.name;
        }

        // description
        if (
          metadata.description !== undefined &&
          metadata.description != productImage.description
        ) {
          productImage.description = metadata.description;
        }

        // main
        if (metadata.main !== undefined && metadata.main != productImage.main) {
          productImage.main = metadata.main;
        }

        let changedState = false;

        // active
        if (
          metadata.active !== undefined &&
          metadata.active != productImage.active
        ) {
          changedState = true;
          productImage.active = !!metadata.active;
        }

        // delete
        if (
          metadata.delete !== undefined &&
          metadata.delete != !!productImage.deletedAt
        ) {
          changedState = true;
          productImage.deletedAt = new Date();
        }

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

  /**
   * Merges files and files metadata into a single array of objects.
   * When metadata is not defined then creates it.
   * @param imageFiles image files.
   * @param additionalData image creation data.
   */
  private mergeImageAndMetadata(
    imageFiles: Array<Express.Multer.File>,
    additionalDataDto: SaveFileAdditionalDataRequestDTO,
  ) {
    if (!imageFiles) {
      throw new UnprocessableEntityException(FileMessage.FILES_NOT_DEFINED);
    }
    if (!imageFiles.length) {
      throw new UnprocessableEntityException(FileMessage.EMPTY_FILE_LIST);
    }

    // if (additionalDataDto.metadatas) {
    //   if (additionalDataDto.metadatas.length != imageFiles.length) {
    //     throw new UnprocessableEntityException(
    //       FileMessage.AMOUNT_OF_METADATA_DIFFERENT_FROM_THE_AMOUNT_OF_FILES,
    //     );
    //   }
    // }
    if (!additionalDataDto.metadatas) {
      // if received file data but not file metadata create metadatas to each file
      additionalDataDto.metadatas = [];
    }

    // images to create

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];

      // checks if file is defined

      if (!imageFile) {
        throw new UnprocessableEntityException(FileMessage.FILE_NOT_DEFINED);
      }

      // checks if is multer file

      if (!this.isMulterFile(imageFile)) {
        throw new UnprocessableEntityException(FileMessage.INVALID_FILE);
      }

      if (!imageFile.originalname) {
        throw new UnprocessableEntityException(
          FileMessage.FILE_NAME_NOT_DEFINED,
        );
      }
      if (typeof imageFile.originalname != 'string') {
        throw new UnprocessableEntityException(FileMessage.INVALID_FILE_NAME);
      }

      // file metadata

      let fileMetadata = additionalDataDto.metadatas.find(
        (m) => m.imageIdx == i,
      );

      if (!fileMetadata) {
        // if don't received file metadata than creates a new one
        fileMetadata = new SaveFileMetadataDto();
        fileMetadata.imageIdx = i;
        additionalDataDto.metadatas.push(fileMetadata);
      }

      // if file is main file

      fileMetadata.main = !!fileMetadata?.main;

      // if file is active

      fileMetadata.active = !!fileMetadata?.active;

      // if file is deleted

      fileMetadata.delete = !!fileMetadata?.delete;

      // image

      fileMetadata.file = imageFile;
    }
  }

  private isMulterFile(value: any): boolean {
    return (
      value instanceof Object &&
      'fieldname' in value &&
      'originalname' in value &&
      'encoding' in value &&
      'mimetype' in value &&
      'size' in value
    );
  }

  private isValidAdditionalDataDto(value: any) {
    return value && !Array.isArray(value) && typeof value == 'object';
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
