import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from 'process';
import { UserService } from 'src/modules/user/services/user/user.service';
import { jwtConstants } from '../../jwt-constants';

export interface AccessTokenPayload {
  sub: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ACCESS_TOKEN_SECRET,
      // secretOrKey: jwtConstants.secret, // TODO:: estamos usando a opção conveniente de fornecer um segredo simétrico para assinar o token. Outras opções, como uma chave pública codificada por PEM, podem ser mais apropriadas para aplicativos de produção (consulte aqui, https://github.com/mikenicholson/passport-jwt#configure-strategy, para obter mais informações). De qualquer forma, conforme advertido anteriormente, não exponha esse segredo publicamente .
      signOptions: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
      },
    });
  }

  async validate(payload: any) {
    //  TODO: we could inject other business logic here. For example, we could do a database lookup in our validate() method to extract more information about the user, resulting in a more enriched user object being available in our Request.
    // This is also the place we may decide to do further token validation, such as looking up the userId in a list of revoked tokens, enabling us to perform token revocation. (maybe using Redis?)
    // return { userId: payload.sub, username: payload.username };
    // NEW:
    const { sub: id } = payload;
    const user = await this.userService.findForId(id);
    if (!user) {
      return null;
    }
    return user;
  }
}
