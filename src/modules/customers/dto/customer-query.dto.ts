import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LoyaltyTier } from '../enums/loyalty-tier.enum';

/**
 * DTO for querying/filtering customers.
 * Supports search by phone/name, filtering by loyalty tier, and checking for store credit.
 */
export class CustomerQueryDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'Search by customer name or phone number',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: LoyaltyTier,
    description: 'Filter by loyalty tier',
  })
  @IsOptional()
  @IsEnum(LoyaltyTier)
  loyaltyTier?: LoyaltyTier;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter customers who have store credit balance',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasStoreCredit?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
