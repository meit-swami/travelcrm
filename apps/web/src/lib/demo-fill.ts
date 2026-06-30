// Random sample-data generators for the "⚡ Fill test data" buttons. Pure
// client helpers — used to speed up manual testing of input forms.

const FIRST = ['Aarav', 'Diya', 'Ishaan', 'Saanvi', 'Arjun', 'Meera', 'Rohan', 'Neha', 'Karan', 'Priya', 'Vikram', 'Anjali'];
const LAST = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Singh', 'Mehta', 'Kapoor'];
const DESTINATIONS = ['Bali', 'Maldives', 'Dubai', 'Thailand', 'Switzerland', 'Singapore', 'Kerala', 'Goa', 'Andaman', 'Vietnam', 'Europe'];

const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = <T,>(arr: T[]): T => arr[r(0, arr.length - 1)];

export interface DemoLead {
  name: string;
  phone: string;
  email: string;
  destination: string;
  adults: string;
  budgetAmount: string;
}

export function randomLead(): DemoLead {
  const first = sample(FIRST);
  const last = sample(LAST);
  return {
    name: `${first} ${last}`,
    phone: `+9198${r(10000000, 99999999)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    destination: sample(DESTINATIONS),
    adults: String(r(1, 5)),
    budgetAmount: String(r(60, 600) * 1000),
  };
}
