import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ModifierGroup } from './entities/modifier-group.entity';
import { Modifier } from './entities/modifier.entity';
import { ProductModifierGroup } from './entities/product-modifier-group.entity';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { ProductRepository } from './repositories/product.repository';
import { ModifierGroupRepository } from './repositories/modifier-group.repository';
import { ModifierRepository } from './repositories/modifier.repository';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ModifierGroup,
      Modifier,
      ProductModifierGroup,
    ]),
    CategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    ModifierGroupRepository,
    ModifierRepository,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
