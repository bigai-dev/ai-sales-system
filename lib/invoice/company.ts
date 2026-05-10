// =============================================================================
// TODO (founder): replace these placeholder values with your actual business
// details before issuing any real tax invoices. The fields below appear on the
// generated PDF and are legally relevant for Malaysian SST compliance.
//
// Required by law:
//   - legalName     — your registered company name (Sdn Bhd, Enterprise, etc.)
//   - ssm           — your SSM business registration number
//   - address       — your registered address (multi-line)
//
// Required if SST-registered (revenue ≥ RM 500K threshold):
//   - sstNumber     — your SST registration number from MySST
//
// Strongly recommended:
//   - email/phone   — for prospect billing contact
//   - bank.*        — payment instructions on the invoice
// =============================================================================

export const COMPANY = {
  legalName: "DC Solutions Sdn Bhd",
  ssm: "201501012345",
  sstNumber: "SST-12345", // empty string "" if not SST-registered
  address: [
    "Unit 12-3, Block A",
    "Some Tower, Some Street",
    "50000 Kuala Lumpur, Malaysia",
  ],
  email: "billing@example.com",
  phone: "+60 12-345-6789",
  bank: {
    name: "Maybank Berhad",
    accountName: "DC Solutions Sdn Bhd",
    accountNumber: "1234-5678-9012",
    swift: "MBBEMYKL",
  },
  paymentTermsDays: 14,
} as const;
