import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
// import * as redisStore from "cache-manager-redis-store";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./modules/user/user.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRoot({
			type: "postgres",
			username: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE_NAME,
			host: process.env.DB_HOST,
			port: Number(process.env.DB_PORT),
			autoLoadEntities: true,
			synchronize: true,
		}),
		// CacheModule.register({
		// 	isGlobal: true,
		// 	store: redisStore,
		// 	host: process.env.REDIS_HOST,
		// 	port: process.env.REDIS_PORT,
		// }),

		UserModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
