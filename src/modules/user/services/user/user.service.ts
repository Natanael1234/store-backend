import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Validator } from 'class-validator';
import { Repository } from 'typeorm';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { validateAndThrows } from '../../../system/utils/validation';
import { CreateUserRequestDTO } from '../../dtos/create-user/create-user.request.dto';
import { UpdateUserRequestDTO } from '../../dtos/update-user/update-user.request.dto';
import { EmailMessage } from '../../enums/email-messages/email-messages.enum';
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
    await validateAndThrows(userDto, CreateUserRequestDTO);
    if (await this.checkIfEmailAlreadyInUse(userDto.email))
      throw new ConflictException(EmailMessage.INVALID);
    const user = new UserEntity();
    user.email = userDto.email;
    user.name = userDto.name;
    user.roles = userDto.roles;
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
    await validateAndThrows(userDto, UpdateUserRequestDTO);
    const existentUser = await this.findForId(userId);
    if (!existentUser) throw new NotFoundException(UserMessage.NOT_FOUND);
    if (userDto.email && existentUser.email != userDto.email) {
      if (await this.checkIfEmailAlreadyInUse(userDto.email)) {
        throw new ConflictException(EmailMessage.INVALID);
      }
    }

    if (userDto.name) existentUser.name = userDto.name;
    if (userDto.email) existentUser.email = userDto.email;
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
    return await this.userRepository.findOne({ where: { email } });
  }

  public async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find(); // TODO: paginação
  }

  public async count(): Promise<number> {
    return await this.userRepository.count();
  }

  // TODO: test
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
