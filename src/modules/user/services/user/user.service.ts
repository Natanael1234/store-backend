import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterRequestDto } from '../../../auth/dtos/requests/register/register.request.dto';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { Repository } from 'typeorm';
import { CreateUserDTO } from '../../dtos/create-user/create-user.dto';
import { UpdateUserDTO } from '../../dtos/update-user/update-user.dto';
import { UserEntity } from '../../models/user/user.entity';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common/exceptions';

import { validate, validateOrReject } from 'class-validator';
import { ClassTransformer } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private encryptionService: EncryptionService,
  ) {}

  public async register(
    registerRequestDto: RegisterRequestDto,
  ): Promise<boolean> {
    return !!(await this.create(registerRequestDto));
  }

  public async create(userDto: CreateUserDTO): Promise<UserEntity> {
    if (!userDto) throw new BadRequestException('User data is required');
    if (!userDto.password)
      throw new UnprocessableEntityException('Password is required');
    if (!userDto.email)
      throw new UnprocessableEntityException('Email is required');
    if (!userDto.name)
      throw new UnprocessableEntityException('Name is required');
    if (!userDto.password)
      throw new UnprocessableEntityException('Password is required');

    const user = new UserEntity();
    user.email = userDto.email;
    user.name = userDto.name;
    user.hash = await this.encryptionService.encrypt(userDto.password);

    return await this.userRepository.save(user);
  }

  public async update(userDto: UpdateUserDTO): Promise<UserEntity> {
    if (!userDto)
      throw new UnprocessableEntityException('User data is required');
    if (!userDto.id) throw new UnprocessableEntityException('Id is required');
    const user = await this.userRepository.findOne({
      where: { id: userDto.id },
    });
    if (!user) throw new NotFoundException('User not found');
    // TODO: melhorar
    if (userDto.name) user.name = userDto.name;
    if (userDto.email) user.email = userDto.email;

    return await this.userRepository.save(user);
  }

  public async findForId(userId: number): Promise<UserEntity> {
    if (!userId) {
      throw new BadRequestException('User id required');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
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
