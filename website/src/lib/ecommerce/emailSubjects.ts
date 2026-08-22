export const PAID_CUSTOMER_EMAIL_SUBJECT_PREFIX = "Pagamento confirmado —";

export function isPaidCustomerFaturaEmailSubject(subject: string) {
  return subject.startsWith(PAID_CUSTOMER_EMAIL_SUBJECT_PREFIX);
}
