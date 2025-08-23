
export type City = {
  name: string;
  paymentMethods?: string[];
};

export type Country = {
  name: string;
  code: string;
  cities: City[];
  paymentMethods: string[];
};

export const countries: Country[] = [
  {
    name: "Congo Brazzaville",
    code: "+242",
    cities: [
      { name: "Brazzaville" },
      { name: "Pointe-Noire" },
      { name: "Dolisie" },
      { name: "Nkayi" },
      { name: "Ouesso" }
    ],
    paymentMethods: ["Airtel Money", "Mobile Money"]
  },
  {
    name: "Gabon",
    code: "+241",
    cities: [
      { name: "Libreville" },
      { name: "Port-Gentil" },
      { name: "Franceville" },
      { name: "Oyem" }
    ],
    paymentMethods: ["Airtel Money", "Moov Money"]
  },
  {
    name: "Sénégal",
    code: "+221",
    cities: [
      { name: "Dakar" },
      { name: "Thiès" },
      { name: "Rufisque" },
      { name: "Saint-Louis" },
      { name: "Kaolack" }
    ],
    paymentMethods: ["Orange Money", "Wave", "Free Money"]
  },
  {
    name: "France",
    code: "+33",
    cities: [
      { name: "Paris" },
      { name: "Marseille" },
      { name: "Lyon" },
      { name: "Toulouse" },
      { name: "Nice" },
      { name: "Nantes" },
      { name: "Strasbourg" }
    ],
    paymentMethods: ["Carte Bancaire", "PayPal", "Virement Bancaire"]
  },
  {
    name: "Italie",
    code: "+39",
    cities: [
      { name: "Rome" },
      { name: "Milan" },
      { name: "Naples" },
      { name: "Turin" },
      { name: "Florence" },
      { name: "Venise" },
      { name: "Bologne" }
    ],
    paymentMethods: ["Carta di Credito", "PayPal", "Bonifico Bancario"]
  },
  {
    name: "Canada",
    code: "+1",
    cities: [
      { name: "Toronto" },
      { name: "Montréal" },
      { name: "Vancouver" },
      { name: "Calgary" },
      { name: "Ottawa" },
      { name: "Edmonton" },
      { name: "Winnipeg" }
    ],
    paymentMethods: ["Credit Card", "Interac", "PayPal"]
  }
];
