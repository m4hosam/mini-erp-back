import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Order } from '../entities/order.entity';

/**
 * ZATCA (Zakat, Tax and Customs Authority) Service
 * Handles Saudi Arabia e-invoicing compliance
 * - Generates SHA256 invoice hash
 * - Creates TLV-encoded QR code
 * - Chains invoice hashes for integrity
 */
@Injectable()
export class ZatcaService {
  private readonly SELLER_NAME = process.env.ZATCA_SELLER_NAME || 'Your Company Name';
  private readonly VAT_NUMBER = process.env.ZATCA_VAT_NUMBER || '300000000000003';

  /**
   * Generate SHA256 hash for invoice
   * @param order - Order entity
   * @returns Base64-encoded SHA256 hash
   */
  generateInvoiceHash(order: Order): string {
    // Create canonical string from order data
    const canonicalString = this.createCanonicalString(order);

    // Generate SHA256 hash
    const hash = createHash('sha256').update(canonicalString).digest('base64');

    return hash;
  }

  /**
   * Generate ZATCA-compliant QR code (TLV encoding)
   * TLV = Tag-Length-Value encoding
   *
   * Tags:
   * 1 = Seller name
   * 2 = VAT registration number
   * 3 = Timestamp (ISO 8601)
   * 4 = Invoice total (with VAT)
   * 5 = VAT amount
   *
   * @param order - Order entity
   * @returns Base64-encoded TLV QR code
   */
  generateQrCode(order: Order): string {
    const tlvData: Buffer[] = [];

    // Tag 1: Seller name
    tlvData.push(this.createTlvEntry(1, this.SELLER_NAME));

    // Tag 2: VAT registration number
    tlvData.push(this.createTlvEntry(2, this.VAT_NUMBER));

    // Tag 3: Timestamp (ISO 8601)
    const timestamp = order.completedAt?.toISOString() || new Date().toISOString();
    tlvData.push(this.createTlvEntry(3, timestamp));

    // Tag 4: Invoice total (with VAT)
    const totalAmount = order.total.toString();
    tlvData.push(this.createTlvEntry(4, totalAmount));

    // Tag 5: VAT amount
    const vatAmount = order.taxTotal.toString();
    tlvData.push(this.createTlvEntry(5, vatAmount));

    // Concatenate all TLV entries
    const tlvBuffer = Buffer.concat(tlvData);

    // Encode to Base64
    return tlvBuffer.toString('base64');
  }

  /**
   * Chain invoice hash with previous hash for integrity
   * @param previousHash - Hash of previous invoice
   * @param currentHash - Hash of current invoice
   * @returns Combined hash
   */
  chainHash(previousHash: string, currentHash: string): string {
    const combinedString = previousHash + currentHash;
    return createHash('sha256').update(combinedString).digest('base64');
  }

  /**
   * Create canonical string representation of order for hashing
   * @param order - Order entity
   * @returns Canonical string
   */
  private createCanonicalString(order: Order): string {
    const parts: string[] = [
      this.SELLER_NAME,
      this.VAT_NUMBER,
      order.orderNumber,
      order.completedAt?.toISOString() || new Date().toISOString(),
      order.total.toString(),
      order.taxTotal.toString(),
    ];

    return parts.join('|');
  }

  /**
   * Create a single TLV (Tag-Length-Value) entry
   * @param tag - Tag number (1-255)
   * @param value - Value string
   * @returns Buffer containing TLV entry
   */
  private createTlvEntry(tag: number, value: string): Buffer {
    const valueBuffer = Buffer.from(value, 'utf8');
    const length = valueBuffer.length;

    // Create buffer: 1 byte tag + 1 byte length + value bytes
    const tlvBuffer = Buffer.alloc(2 + length);
    tlvBuffer.writeUInt8(tag, 0); // Tag
    tlvBuffer.writeUInt8(length, 1); // Length
    valueBuffer.copy(tlvBuffer, 2); // Value

    return tlvBuffer;
  }

  /**
   * Get the last invoice hash from database (for chaining)
   * In a real implementation, this would query the last completed order
   * @returns Previous invoice hash or null
   */
  async getLastInvoiceHash(): Promise<string | null> {
    // TODO: Implement database query to get last completed order's hash
    // For now, return null (first invoice in chain)
    return null;
  }
}
