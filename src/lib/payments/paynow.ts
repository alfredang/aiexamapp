import QRCode from 'qrcode';
import { getSetting } from '@/lib/settings';

// EMVCo SGQR payload builder for PayNow. PayNow itself has no inbound webhook
// for unincorporated merchants — confirmation is manual via admin.
//
// References:
//   - EMVCo Merchant-Presented QR spec
//   - MAS PayNow Corporate guidelines
//
// Layout (TLV: 2-digit ID, 2-digit length, value):
//   00 Payload format indicator   "01"
//   01 Point of initiation method "12" (dynamic; amount set)
//   26 Merchant Account Info (PayNow group)
//      00 GUID         "SG.PAYNOW"
//      01 Proxy type   "2" (UEN) or "0" (mobile)
//      02 Proxy value  e.g. UEN
//      03 Editable     "0" (locked amount) / "1" (editable)
//   52 Merchant Category Code "0000"
//   53 Transaction currency   "702" (SGD)
//   54 Transaction amount     e.g. "10.00"
//   58 Country code           "SG"
//   59 Merchant name
//   60 Merchant city
//   62 Additional data
//      01 Bill number (our Order.id, ≤25 chars per spec — truncated if longer)
//   63 CRC                    CRC-16/CCITT-FALSE over the entire payload including
//                             "6304" prefix, computed last.

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(s: string): string {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export type SgqrInput = {
  uen: string;
  amount: number; // cents
  reference: string;
  merchantName?: string;
  merchantCity?: string;
  editable?: boolean;
};

export function buildSgqrPayload(input: SgqrInput): string {
  const merchant = tlv('00', 'SG.PAYNOW') + tlv('01', '2') + tlv('02', input.uen) + tlv('03', input.editable ? '1' : '0');
  const ref = (input.reference || '').slice(0, 25);
  const amountDecimal = (input.amount / 100).toFixed(2);
  const body =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('26', merchant) +
    tlv('52', '0000') +
    tlv('53', '702') +
    tlv('54', amountDecimal) +
    tlv('58', 'SG') +
    tlv('59', (input.merchantName || 'Merchant').slice(0, 25)) +
    tlv('60', (input.merchantCity || 'Singapore').slice(0, 15)) +
    tlv('62', tlv('01', ref));
  const toSign = body + '6304';
  return body + tlv('63', crc16(toSign));
}

export async function renderQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, scale: 8 });
}

export async function isEnabled(): Promise<boolean> {
  return (await getSetting('PAYNOW_ENABLED')) === 'true';
}

export async function getMerchantConfig() {
  const [uen, name, city] = await Promise.all([
    getSetting('PAYNOW_UEN'),
    getSetting('BRAND_NAME'),
    getSetting('FULFILLMENT_TIMEZONE')
  ]);
  return {
    uen,
    merchantName: name || 'Merchant',
    merchantCity: city?.split('/')[1] || 'Singapore'
  };
}
