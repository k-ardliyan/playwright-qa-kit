/**
 * Test Data Factory — Generate realistic test data without hardcoded dummies or external dependencies.
 * Tailored for Indonesian locale and common QA automation scenarios.
 */

// Helper: Get random element from array
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper: Get random digits of length N
const randomDigits = (length: number): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
};

// Static lists for realistic Indonesian mock data
const companyNames = [
  'Maju Sejahtera',
  'Karya Abadi',
  'Sinar Gemilang',
  'Bumi Indah',
  'Makmur Sentosa',
  'Jaya Bersama',
  'Sumber Rejeki',
  'Mega Utama',
  'Putra Mandiri',
  'Nusantara Jaya',
  'Globalindo Teknik',
  'Dharma Bakti',
  'Wira Karya',
  'Cipta Pratama',
  'Indo Perkasa',
];

const companyTypes = ['PT', 'CV', 'UD'];

const firstNames = [
  'Budi',
  'Joko',
  'Andi',
  'Siti',
  'Dewi',
  'Rian',
  'Eko',
  'Agus',
  'Indra',
  'Adit',
  'Rina',
  'Mega',
  'Sari',
  'Heri',
  'Wawan',
  'Dedi',
  'Bambang',
  'Toni',
  'Rudi',
  'Sri',
];

const lastNames = [
  'Santoso',
  'Prasetyo',
  'Wibowo',
  'Kusuma',
  'Laksana',
  'Hidayat',
  'Saputra',
  'Wijaya',
  'Nugroho',
  'Setiawan',
  'Gunawan',
  'Sutrisno',
  'Purnomo',
  'Kartika',
  'Siregar',
  'Lubis',
];

const jobPositions = [
  'Software Engineer',
  'QA Engineer',
  'Product Manager',
  'HR Manager',
  'Sales Specialist',
  'Finance Operations',
  'System Administrator',
  'Marketing Lead',
  'Legal Counsel',
  'Purchasing Staff',
];

const cities = [
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Semarang',
  'Medan',
  'Makassar',
  'Yogyakarta',
  'Denpasar',
  'Tangerang',
  'Bekasi',
];

const streets = [
  'Jl. Sudirman No. ',
  'Jl. Thamrin No. ',
  'Jl. Gatot Subroto No. ',
  'Jl. Dago No. ',
  'Jl. Merdeka No. ',
  'Jl. Asia Afrika No. ',
  'Jl. Pemuda No. ',
  'Jl. Malioboro No. ',
  'Jl. Diponegoro No. ',
  'Jl. Gajah Mada No. ',
];

export class CustomerFactory {
  /**
   * Generates a unique customer group name with a timestamp.
   * Format: "Test Group 1708678912"
   */
  static groupName(prefix = 'Test Group'): string {
    return `${prefix} ${Math.floor(Date.now() / 1000)}`;
  }

  /**
   * Generates a complete realistic customer dataset.
   */
  static customerData() {
    const type = randomElement(companyTypes);
    const name = randomElement(companyNames);
    const timestamp = Math.floor(Date.now() / 1000);
    const companyFullName = `${type} ${name} ${timestamp}`;

    // Clean name for email domain, e.g., pt_karya_abadi
    const domainPart = companyFullName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    return {
      name: companyFullName,
      email: `info@${domainPart}.co.id`,
      phone: `08${randomDigits(10)}`,
      address: `${randomElement(streets)}${Math.floor(Math.random() * 150) + 1}`,
      city: randomElement(cities),
      npwp: `${randomDigits(2)}.${randomDigits(3)}.${randomDigits(3)}.${randomDigits(1)}-${randomDigits(3)}.${randomDigits(3)}`,
    };
  }

  /**
   * Generates realistic contact person data.
   */
  static contactPerson() {
    const first = randomElement(firstNames);
    const last = randomElement(lastNames);
    const name = `${first} ${last}`;
    const username = `${first.toLowerCase()}.${last.toLowerCase()}`;

    return {
      name,
      email: `${username}_${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `08${randomDigits(10)}`,
      position: randomElement(jobPositions),
    };
  }
}

/**
 * Generates a unique name with a timestamp.
 */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Math.floor(Date.now() / 1000)}`;
}

/**
 * Generates a unique email with a timestamp.
 */
export function uniqueEmail(domain = 'test.example.com'): string {
  return `qa_${Math.floor(Date.now() / 1000)}@${domain}`;
}
