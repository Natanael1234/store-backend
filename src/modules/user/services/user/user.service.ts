import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { Repository } from 'typeorm';
import { UpdateUserRequestDTO } from '../../dtos/update-user/update-user.request.dto';
import { UserEntity } from '../../models/user/user.entity';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common/exceptions';
import { CreateUserRequestDTO } from '../../dtos/create-user/create-user.request.dto';
import { UserMessage } from '../../enums/user-messages.ts/user-messages.enum';
import { PasswordMessage } from '../../enums/password-messages/password-messages.enum';
import { EmailMessage } from '../../enums/email-messages/email-messages.enum';
import { NameMessage } from '../../enums/name-messages/name-messages.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private encryptionService: EncryptionService,
  ) {}

  public async create(userDto: CreateUserRequestDTO): Promise<UserEntity> {
    if (!userDto) throw new BadRequestException(UserMessage.DATA_REQUIRED);
    if (!userDto.email)
      throw new UnprocessableEntityException(EmailMessage.REQUIRED);
    if (!userDto.name)
      throw new UnprocessableEntityException(NameMessage.REQUIRED);
    if (!userDto.password)
      throw new UnprocessableEntityException(PasswordMessage.REQUIRED);

    const existentUser = await this.findForEmail(userDto.email);
    if (existentUser) throw new ConflictException(EmailMessage.INVALID);

    const user = new UserEntity();
    user.email = userDto.email;
    user.name = userDto.name;
    user.hash = await this.encryptionService.encrypt(userDto.password);

    await this.userRepository.save(user);
    return this.userRepository.findOne({ where: { id: user.id } });
  }

  public async update(
    userId: number,
    userDto: UpdateUserRequestDTO,
  ): Promise<UserEntity> {
    if (!userDto)
      throw new UnprocessableEntityException(UserMessage.DATA_REQUIRED);
    if (!userId)
      throw new UnprocessableEntityException(UserMessage.ID_REQUIRED);
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(UserMessage.NOT_FOUND);
    // TODO: melhorar
    if (userDto.name) user.name = userDto.name;
    if (userDto.email) user.email = userDto.email;

    await this.userRepository.save(user);
    return this.userRepository.findOne({ where: { id: user.id } });
  }

  public async findForId(userId: number): Promise<UserEntity> {
    if (!userId) {
      throw new BadRequestException(UserMessage.ID_REQUIRED);
    }
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
