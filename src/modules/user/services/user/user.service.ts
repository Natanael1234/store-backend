import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { RegisterRequestDto } from '../../../auth/dtos/requests/register/register.request.dto';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDTO } from '../../dtos/create-user/create-user.dto';
import { UpdateUserDTO } from '../../dtos/update-user/update-user.dto';
import { UserEntity } from '../../models/user/user.entity';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common/exceptions';

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
    if (!userDto) throw new BadRequestException('Undefined user data');
    const user = new UserEntity();
    user.email = userDto.email;
    user.name = userDto.name;
    user.hash = await this.encryptionService.encrypt(userDto.password);
    try {
    } catch (error) {
      if (error instanceof QueryFailedError) {
        console.log(error);
        throw error;
      } else {
        console.error('sadfg');
      }
      throw error;
    }
    return this.userRepository.save(user);
  }

  public async update(user: UpdateUserDTO): Promise<UserEntity> {
    return this.userRepository.save(user);
  }

  public async findForId(userId: number): Promise<UserEntity> {
    if (!userId) {
      throw new BadRequestException('User id not defined');
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
