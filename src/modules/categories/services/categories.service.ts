import { Injectable, Logger } from '@nestjs/common';
import { GenericService } from '../../../common/services/generic.service';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryRepository } from '../repositories/category.repository';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';
import { NotFoundException } from '../../../common/exceptions/not-found.exception';

@Injectable()
export class CategoriesService extends GenericService<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto
> {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly categoryRepo: CategoryRepository) {
    super(categoryRepo, 'Category');
  }

  toResponseDto(entity: Category): CategoryResponseDto {
    return {
      id: entity.id,
      nameAr: entity.nameAr,
      nameEn: entity.nameEn,
      slug: entity.slug,
      description: entity.description,
      isActive: entity.isActive,
      parentId: entity.parent?.id,
      children: entity.children?.map((child) => this.toResponseDto(child)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
    };
  }

  toEntity(dto: CreateCategoryDto | UpdateCategoryDto): Partial<Category> {
    const entity: Partial<Category> = {
      nameAr: dto.nameAr,
      nameEn: dto.nameEn,
      description: dto.description,
    };

    // Auto-generate slug from nameEn if creating
    if (dto.nameEn) {
      entity.slug = this.generateSlug(dto.nameEn);
    }

    return entity;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  async create(
    dto: CreateCategoryDto,
    userId?: number,
  ): Promise<CategoryResponseDto> {
    // Validate unique slug
    const slug = this.generateSlug(dto.nameEn);
    const existingBySlug = await this.categoryRepo.findBySlug(slug);
    if (existingBySlug) {
      throw new BusinessValidationException(
        ErrorMessages.CategorySlugAlreadyExists,
      );
    }

    // Validate parent category exists if provided
    let parent: Category | undefined;
    if (dto.parentId) {
      const parentCategory = await this.categoryRepo.findById(dto.parentId);
      if (!parentCategory) {
        throw new NotFoundException(ErrorMessages.ParentCategoryNotFound);
      }
      parent = parentCategory;
    }

    const entityData = this.toEntity(dto);
    if (userId) {
      entityData.createdBy = userId;
    }
    if (parent) {
      entityData.parent = parent;
    }

    const entity = await this.categoryRepo.create(entityData);
    return this.toResponseDto(entity);
  }

  async update(
    dto: UpdateCategoryDto,
    userId?: number,
  ): Promise<CategoryResponseDto> {
    const id = dto.id;

    const existingEntity = await this.categoryRepo.findById(id);
    if (!existingEntity) {
      throw new NotFoundException(ErrorMessages.CategoryNotFound);
    }

    // Validate unique slug if nameEn changed
    if (dto.nameEn && dto.nameEn !== existingEntity.nameEn) {
      const slug = this.generateSlug(dto.nameEn);
      const existingBySlug = await this.categoryRepo.findBySlug(slug);
      if (existingBySlug && existingBySlug.id !== id) {
        throw new BusinessValidationException(
          ErrorMessages.CategorySlugAlreadyExists,
        );
      }
    }

    // Validate parent category exists if provided
    let parent: Category | undefined;
    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        parent = undefined;
      } else {
        const parentCategory = await this.categoryRepo.findById(dto.parentId);
        if (!parentCategory) {
          throw new NotFoundException(ErrorMessages.ParentCategoryNotFound);
        }
        // Prevent self-referencing
        if (parentCategory.id === id) {
          throw new BusinessValidationException({
            key: 'CATEGORY_SELF_REFERENCE',
            message: 'Category cannot be its own parent.',
          });
        }
        parent = parentCategory;
      }
    }

    const entityData = this.toEntity(dto);
    if (userId) {
      entityData.updatedBy = userId;
    }
    if (parent !== undefined) {
      entityData.parent = parent;
    }

    const updatedEntity = await this.categoryRepo.update(id, entityData);
    if (!updatedEntity) {
      throw new NotFoundException(ErrorMessages.CategoryNotFound);
    }
    return this.toResponseDto(updatedEntity);
  }

  async getCategoryTree(): Promise<CategoryResponseDto[]> {
    const tree = await this.categoryRepo.findTree();
    return tree.map((category) => this.toResponseDto(category));
  }
}
