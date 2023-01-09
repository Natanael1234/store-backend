import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../../jwt-constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, // TODO:: estamos usando a opção conveniente de fornecer um segredo simétrico para assinar o token. Outras opções, como uma chave pública codificada por PEM, podem ser mais apropriadas para aplicativos de produção (consulte aqui, https://github.com/mikenicholson/passport-jwt#configure-strategy, para obter mais informações). De qualquer forma, conforme advertido anteriormente, não exponha esse segredo publicamente .
    });
  }

  async validate(payload: any) {
    //  TODO: we could inject other business logic here. For example, we could do a database lookup in our validate() method to extract more information about the user, resulting in a more enriched user object being available in our Request.

    // This is also the place we may decide to do further token validation, such as looking up the userId in a list of revoked tokens, enabling us to perform token revocation. (maybe using Redis?)
    return { userId: payload.sub, username: payload.username };
  }
}
