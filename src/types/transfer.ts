
export type TransferData = {
  recipient: {
    fullName: string;
    country: string;
    phone: string;
  };
  transfer: {
    amount: number;
    currency: string;
  };
};

export const INITIAL_TRANSFER_DATA: TransferData = {
  recipient: {
    fullName: "",
    country: "", // Will be set by default to user's country
    phone: "",
  },
  transfer: {
    amount: 0,
    currency: "XAF",
  },
};
