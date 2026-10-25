import type { PageResponse } from "@/lib/api/contracts";

export type StorefrontLocale = "es-GT" | "en-US";

export type PublicCatalogImage = { mediaId: string; position: number; url: string };
export type PublicCatalogItem = {
  itemType: "PRODUCT" | "COMBO";
  listingId: string;
  title: string;
  description: string | null;
  images: PublicCatalogImage[];
};

export type StorefrontSession = {
  sessionId: string | null;
  sessionToken: string | null;
  customerId: string;
  email: string;
  verified: boolean;
  profileComplete: boolean;
  expiresAt: string | null;
};

export type StorefrontAddress = {
  id: string;
  label: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  active: boolean;
};

export type StorefrontBranch = {
  branchId: string;
  branchName: string;
  address: string | null;
  pickupEnabled: boolean;
  preparationMinutes: number;
};

export type StorefrontOffer = {
  itemType: "PRODUCT" | "COMBO";
  listingId: string;
  offerId: string;
  title: string;
  description: string | null;
  presentationName: string | null;
  unitPrice: number;
  availability: "AVAILABLE" | "SOLD_OUT";
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  maximumQuantity: number | null;
  images: PublicCatalogImage[];
};

export type StorefrontCartItem = {
  id: string;
  type: "PRODUCT" | "COMBO";
  offerId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  validationStatus: string;
  validationMessage: string | null;
};

export type StorefrontCart = {
  id: string;
  customerId: string;
  branchId: string;
  channel: "WEB";
  status: string;
  expiresAt: string;
  items: StorefrontCartItem[];
};

export type StorefrontOrderItem = {
  id: string;
  type: "PRODUCT" | "COMBO";
  name: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
};

export type StorefrontOrder = {
  id: string;
  orderNumber: string;
  branchId: string;
  customerId: string;
  status: string;
  fulfillmentMode: "DELIVERY" | "PICKUP";
  paymentMethod: "BANK_TRANSFER" | "CASH_ON_FULFILLMENT";
  subtotal: number;
  taxAmount: number;
  deliveryAmount: number;
  totalAmount: number;
  fulfillmentDate: string;
  pickupCode: string | null;
  expiresAt: string | null;
  timezoneSnapshot: string;
  items: StorefrontOrderItem[];
  createdAt: string;
};

export type StorefrontOrdersPage = PageResponse<StorefrontOrder>;

export type StorefrontBankAccount = {
  id: string;
  bankName: string;
  accountHolder: string;
  accountType: string;
  maskedAccountNumber: string;
  currencyCode: string;
  instructions: string | null;
};

export type StorefrontCartSelection = {
  cartId: string;
  fulfillmentMode: "DELIVERY" | "PICKUP";
  addressId: string | null;
  branchId: string;
};
