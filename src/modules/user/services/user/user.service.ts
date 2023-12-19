import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Validator } from 'class-validator';
import { Repository } from 'typeorm';
import { PaginationConfigs } from '../../../system/configs/pagination/pagination.configs';
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { EmailMessage } from '../../../system/messages/email/email.messages.enum';
import { isValidUUID } from '../../../system/utils/validation/uuid/is-valid-uuid-fn';
import { validateOrThrowError } from '../../../system/utils/validation/validation';
import { UserConstants } from '../../constants/user/user-entity.constants';
import { CreateUserRequestDTO } from '../../dtos/create-user/create-user.request.dto';
import { FindUserRequestDTO } from '../../dtos/find-users/find-users.request.dto';
import { UpdatePasswordResponseDTO } from '../../dtos/update-password-response/update-password.response.dto';
import { UpdatePasswordRequestDTO } from '../../dtos/update-password/update-password.request.dto';
import { UpdateUserRequestDTO } from '../../dtos/update-user/update-user.request.dto';
import { UserMessage } from '../../enums/messages/user/user.messages.enum';
import { UserOrder } from '../../enums/sort/user-order/user-order.enum';
import { User } from '../../models/user/user.entity';

@Injectable()
export class UserService {
  readonly validator = new Validator();
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private encryptionService: EncryptionService,
  ) {}

  public async create(userDto: CreateUserRequestDTO): Promise<User> {
    if (!userDto) throw new BadRequestException(UserMessage.DATA_REQUIRED);
    userDto = plainToInstance(CreateUserRequestDTO, userDto);
    await validateOrThrowError(userDto, CreateUserRequestDTO);
    if (await this.checkIfEmailAlreadyInUse(userDto.email)) {
      throw new ConflictException(EmailMessage.INVALID);
    }
    const user = new User();
    user.email = userDto.email;
    user.name = userDto.name;
    user.roles = userDto.roles;
    user.active = userDto.active;
    user.hash = await this.encryptionService.encrypt(userDto.password);
    await this.userRepo.save(user);
    const ret = await this.userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ID_EQUALS_TO, { userId: user.id })
      .getOne();
    return ret;
  }

  public async update(
    userId: string,
    userDto: UpdateUserRequestDTO,
  ): Promise<User> {
    if (userId == null)
      throw new UnprocessableEntityException(UserMessage.REQUIRED_USER_ID);
    if (!isValidUUID(userId)) {
      throw new UnprocessableEntityException(UserMessage.INVALID_USER_ID);
    }

    if (!userDto) throw new BadRequestException(UserMessage.DATA_REQUIRED);

    userDto = plainToInstance(UpdateUserRequestDTO, userDto);
    await validateOrThrowError(userDto, UpdateUserRequestDTO);
    const existentUser = await this.findForId(userId);
    if (!existentUser) throw new NotFoundException(UserMessage.NOT_FOUND);
    if (userDto.email && existentUser.email != userDto.email) {
      if (await this.checkIfEmailAlreadyInUse(userDto.email)) {
        throw new ConflictException(EmailMessage.INVALID);
      }
    }

    if (userDto.name) existentUser.name = userDto.name;
    if (userDto.email) existentUser.email = userDto.email;
    if (userDto.active != null) existentUser.active = userDto.active;
    // if (userDto.roles) existentUser.roles = userDto.roles;

    await this.userRepo.save(existentUser);
    return this.findForId(userId);
  }

  public async findForId(userId: string): Promise<User> {
    if (!userId) {
      throw new BadRequestException(UserMessage.ID_REQUIRED);
    }
    if (userId && !isValidUUID(userId)) {
      throw new UnprocessableEntityException(UserMessage.INVALID_USER_ID);
    }

    const user = await this.userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ID_EQUALS_TO, { userId })
      .getOne();

    if (!user) throw new NotFoundException(UserMessage.NOT_FOUND);
    return user;
  }

  public async findForName(userName: string): Promise<User> {
    return this.userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_NAME_EQUALS_TO, { userName })
      .getOne();
  }

  public async findForEmail(email: string): Promise<User> {
    // TODO: testar se deletado

    return this.userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_EMAIL_EQUALS_TO, { email })
      .getOne();
  }

  public async find(
    findDTO?: FindUserRequestDTO,
  ): Promise<PaginatedResponseDTO<User, UserOrder>> {
    findDTO = plainToInstance(FindUserRequestDTO, findDTO || {});
    await validateOrThrowError(findDTO || {}, FindUserRequestDTO);

    let { textQuery, active, deleted, page, pageSize, orderBy } = findDTO;

    let select = this.userRepo.createQueryBuilder(UserConstants.USER);

    // textQuery by name

    if (textQuery) {
      select = select.andWhere(UserConstants.USER_NAME_LIKE_TEXT_QUERY, {
        textQuery,
      });
    }

    // active

    if (active == ActiveFilter.ACTIVE) {
      select = select.andWhere(UserConstants.USER_ACTIVE_EQUALS_TO, {
        isActiveUser: true,
      });
    } else if (active == ActiveFilter.INACTIVE) {
      select = select.andWhere(UserConstants.USER_ACTIVE_EQUALS_TO, {
        isActiveUser: false,
      });
    }

    // deletedAt

    if (deleted == DeletedFilter.DELETED) {
      select = select
        .withDeleted()
        .andWhere(UserConstants.USER_DELETED_AT_IS_NOT_NULL);
    } else if (deleted == DeletedFilter.ALL) {
      select = select.withDeleted();
    }

    // pagination

    pageSize = pageSize || PaginationConfigs.DEFAULT_PAGE_SIZE;
    select = select.take(pageSize).skip((page - 1) * pageSize);

    // sort

    for (let i = 0; i < orderBy.length; i++) {
      const [column, direction] = orderBy[i].split('_'); // TODO: move to DTO
      if (i == 0) {
        select = select.orderBy(
          `user.${column}`,
          direction.toUpperCase() as 'ASC' | 'DESC',
        );
      } else {
        select = select.addOrderBy(
          `user.${column}`,
          direction.toUpperCase() as 'ASC' | 'DESC',
        );
      }
    }

    // results

    const [results, count] = await select.getManyAndCount();

    textQuery = textQuery?.replace(/(^%|%$)/g, '').replace(/%/g, ' ');
    return new PaginatedResponseDTO(
      textQuery,
      count,
      page,
      pageSize,
      orderBy,
      results,
    );
  }

  public async count(): Promise<number> {
    return await this.userRepo.count();
  }

  public async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordRequestDTO,
  ): Promise<UpdatePasswordResponseDTO> {
    if (!userId) {
      throw new BadRequestException(UserMessage.ID_REQUIRED);
    }
    if (!isValidUUID(userId)) {
      throw new UnprocessableEntityException(UserMessage.INVALID_USER_ID);
    }
    if (!updatePasswordDto) {
      throw new BadRequestException('Data is required'); // TODO: move message to a enum
    }
    await validateOrThrowError(updatePasswordDto, UpdatePasswordRequestDTO);
    const user = await this.userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_ID_EQUALS_TO, { userId })
      .getOne();
    if (!user) throw new NotFoundException(UserMessage.NOT_FOUND);
    user.hash = await this.encryptionService.encrypt(
      updatePasswordDto.password,
    );
    await this.userRepo.save(user);
    return { status: 'success' };
  }

  async checkIfEmailAlreadyInUse(email: string): Promise<boolean> {
    const user = await this.userRepo
      .createQueryBuilder(UserConstants.USER)
      .where(UserConstants.USER_EMAIL_EQUALS_TO, { email })
      .withDeleted()
      .getOne();
    return !!user;
  }

  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH) // add hash/password
      .where({ email })
      .getOne();

    if (user) {
      const decryptedPasword = await this.encryptionService.decrypt(user.hash);
      if (decryptedPasword === password) {
        delete user.hash; // remove hash/password
        return user;
      }
    }
    return null;
  }
}
