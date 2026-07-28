/**
 * Types for @paystack/inline-js (v2.24.0), which ships no declarations of its
 * own.
 *
 * Transcribed from the package's bundled README rather than guessed. Only the
 * surface we actually use is declared — adding a blanket `declare module` with
 * `any` would silently accept a wrong callback shape on the payment path,
 * which is the last place to lose type safety.
 */
declare module '@paystack/inline-js' {
  export interface PaystackTransaction {
    id?: number;
    reference: string;
    message?: string;
  }

  export interface PaystackLoadEvent {
    id?: number;
    customer?: Record<string, unknown>;
    accessCode?: string;
  }

  export interface PaystackErrorEvent {
    message?: string;
  }

  export interface PaystackCallbacks {
    /** Customer completed the transaction. Verify server-side before trusting. */
    onSuccess?: (transaction: PaystackTransaction) => void;
    /** Customer closed the overlay. Receives no arguments. */
    onCancel?: () => void;
    /** Checkout form loaded and is visible. */
    onLoad?: (event: PaystackLoadEvent) => void;
    /** Transaction could not be loaded. */
    onError?: (error: PaystackErrorEvent) => void;
  }

  export interface NewTransactionOptions extends PaystackCallbacks {
    key: string;
    email: string;
    /** In kobo. */
    amount: number;
    currency?: string;
    reference?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    channels?: string[];
    metadata?: Record<string, unknown>;
  }

  export default class PaystackPop {
    isLoaded(): boolean;
    /**
     * Starts a transaction from the browser, taking the amount as a parameter.
     *
     * Prefer resumeTransaction: an amount supplied by the client is an amount
     * the client can change.
     */
    newTransaction(options: NewTransactionOptions): unknown;
    /**
     * Resumes a transaction created server-side via /transaction/initialize.
     * The amount is fixed on the server and cannot be influenced here.
     */
    resumeTransaction(accessCode: string, callbacks: PaystackCallbacks): unknown;
    cancelTransaction(id?: string): unknown;
    preloadTransaction(options: NewTransactionOptions): unknown;
  }
}
