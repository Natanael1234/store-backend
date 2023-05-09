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
import { FilteringRequestDTO } from '../../../system/dtos/request/filtering/filtering.request.dto';
import { PaginationConfig } from '../../../system/dtos/request/pagination/configs/pagination.config';
import { PaginationRequestDTO } from '../../../system/dtos/request/pagination/pagination.request.dto';
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { EmailMessage } from '../../../system/enums/messages/email-messages/email-messages.enum';
import { validateOrThrowError } from '../../../system/utils/validation';
import { CreateUserRequestDTO } from '../../dtos/request/create-user/create-user.request.dto';
import { UpdatePasswordRequestDTO } from '../../dtos/request/update-password/update-password.request.dto';
import { UpdateUserRequestDTO } from '../../dtos/request/update-user/update-user.request.dto';
import { UpdatePasswordResponseDTO } from '../../dtos/response/update-password/update-password.response.dto';
import { UserMessage } from '../../enums/user-messages.ts/user-messages.enum';
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
    filtering?: FilteringRequestDTO,
    pagination?: PaginationRequestDTO,
  ): Promise<PaginatedResponseDTO<UserEntity>> {
    filtering = plainToInstance(FilteringRequestDTO, filtering || {});
    await validateOrThrowError(filtering || {}, FilteringRequestDTO);
    pagination = plainToInstance(PaginationRequestDTO, pagination || {});
    await validateOrThrowError(pagination || {}, PaginationRequestDTO);
    const { query, active, deleted } = filtering;
    const { page, pageSize, skip, take } = pagination;
    const findManyOptions: FindManyOptions = {};
    findManyOptions.take = take || PaginationConfig.DEFAULT_PAGE_SIZE;
    findManyOptions.skip = skip || 0;
    findManyOptions.where = {};

    if (active == ActiveFilter.ACTIVE) {
      findManyOptions.where.active = true;
    } else if (active == ActiveFilter.INACTIVE) {
      findManyOptions.where.active = false;
    }
    if (query != null) {
      if (query) {
        findManyOptions.where.name = ILike(`%${query.replace(' ', '%')}%`);
      }
    }
    if (deleted == DeletedFilter.DELETED) {
      findManyOptions.where.deletedAt = Not(IsNull());
      findManyOptions.withDeleted = true;
    } else if (deleted == DeletedFilter.ALL) {
      findManyOptions.withDeleted = true;
    }

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
