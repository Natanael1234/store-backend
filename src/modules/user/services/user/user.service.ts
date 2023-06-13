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
import { FindManyOptions, ILike, IsNull, Not, Repository } from 'typeorm';
import { PaginationConfig } from '../../../system/dtos/request/pagination/configs/pagination.config';
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { EmailMessage } from '../../../system/enums/messages/email-messages/email-messages.enum';
import { validateOrThrowError } from '../../../system/utils/validation';
import { CreateUserRequestDTO } from '../../controllers/user/dtos/request/create-user/create-user.request.dto';
import { FindUserRequestDTO } from '../../controllers/user/dtos/request/find-users/find-users.request.dto';
import { UpdatePasswordRequestDTO } from '../../controllers/user/dtos/request/update-password/update-password.request.dto';
import { UpdateUserRequestDTO } from '../../controllers/user/dtos/request/update-user/update-user.request.dto';
import { UpdatePasswordResponseDTO } from '../../controllers/user/dtos/response/update-password/update-password.response.dto';
import { UserMessage } from '../../enums/messages/user/user-messages.ts/user-messages.enum';
import { UserOrder } from '../../enums/sort/user-order/user-order.enum';
import { UserEntity } from '../../models/user/user.entity';

@Injectable()
export class UserService {
  readonly validator = new Validator();
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private encryptionService: EncryptionService,
  ) {}

  public async create(userDto: CreateUserRequestDTO): Promise<UserEntity> {
    if (!userDto) throw new BadRequestException(UserMessage.DATA_REQUIRED);
    userDto = plainToInstance(CreateUserRequestDTO, userDto);
    await validateOrThrowError(userDto, CreateUserRequestDTO);
    if (await this.checkIfEmailAlreadyInUse(userDto.email))
      throw new ConflictException(EmailMessage.INVALID);
    const user = new UserEntity();
    user.email = userDto.email;
    user.name = userDto.name;
    user.roles = userDto.roles;
    user.active = userDto.active;
    user.hash = await this.encryptionService.encrypt(userDto.password);
    await this.userRepository.save(user);
    return this.findForId(user.id);
  }

  public async update(
    userId: number,
    userDto: UpdateUserRequestDTO,
  ): Promise<UserEntity> {
    if (!userDto) throw new BadRequestException(UserMessage.DATA_REQUIRED);
    if (!userId)
      throw new UnprocessableEntityException(UserMessage.ID_REQUIRED);
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

    await this.userRepository.save(existentUser);
    return this.findForId(userId);
  }

  public async findForId(userId: number): Promise<UserEntity> {
    if (!userId) throw new BadRequestException(UserMessage.ID_REQUIRED);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(UserMessage.NOT_FOUND);
    return user;
  }

  public async findForName(userName: string): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { name: userName } });
  }

  public async findForEmail(email: string): Promise<UserEntity> {
    // TODO: testar se deletado
    return await this.userRepository.findOne({
      where: { email },
      withDeleted: true,
    });
  }

  public async find(
    findDTO?: FindUserRequestDTO,
  ): Promise<PaginatedResponseDTO<UserEntity>> {
    findDTO = plainToInstance(FindUserRequestDTO, findDTO || {});
    await validateOrThrowError(findDTO || {}, FindUserRequestDTO);

    let { query, active, deleted, page, pageSize, orderBy } = findDTO;
    const findManyOptions: FindManyOptions = {};

    findManyOptions.where = {};

    // text query
    if (query != null) {
      if (query) {
        findManyOptions.where.name = ILike(`%${query.replace(' ', '%')}%`);
      }
    }

    // active
    if (active == ActiveFilter.ACTIVE) {
      findManyOptions.where.active = true;
    } else if (active == ActiveFilter.INACTIVE) {
      findManyOptions.where.active = false;
    }

    // deleted
    if (deleted == DeletedFilter.DELETED) {
      findManyOptions.where.deletedAt = Not(IsNull());
      findManyOptions.withDeleted = true;
    } else if (deleted == DeletedFilter.ALL) {
      findManyOptions.withDeleted = true;
    }

    // pagination
    page = page || PaginationConfig.DEFAULT_PAGE;
    pageSize = pageSize || PaginationConfig.DEFAULT_PAGE_SIZE;
    findManyOptions.take = pageSize;
    findManyOptions.skip = (page - 1) * pageSize;

    // sort
    orderBy = orderBy || [UserOrder.NAME_ASC];
    findManyOptions.order = {};
    for (let orderItem of orderBy) {
      const [column, direction] = orderItem.split('_');
      findManyOptions.order[column] = direction;
    }

    // results
    const [results, count] = await this.userRepository.findAndCount(
      findManyOptions,
    );
    return new PaginatedResponseDTO(results, count, page, pageSize);
  }

  public async count(): Promise<number> {
    return await this.userRepository.count();
  }

  public async updatePassword(
    userId: number,
    updatePasswordDto: UpdatePasswordRequestDTO,
  ): Promise<UpdatePasswordResponseDTO> {
    if (!userId) throw new BadRequestException(UserMessage.ID_REQUIRED);
    if (!updatePasswordDto) throw new BadRequestException('Data is required'); // TODO: move message to a enum
    await validateOrThrowError(updatePasswordDto, UpdatePasswordRequestDTO);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(UserMessage.NOT_FOUND);
    user.hash = await this.encryptionService.encrypt(
      updatePasswordDto.password,
    );
    await this.userRepository.save(user);
    return { status: 'success' };
  }

  async checkIfEmailAlreadyInUse(email: string): Promise<boolean> {
    return !!(await this.findForEmail(email));
  }

  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.hash') // add hash/password
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
