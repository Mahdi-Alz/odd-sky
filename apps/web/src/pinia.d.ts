import "pinia";

declare module "pinia" {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: { key: string };
  }

  export interface PiniaCustomProperties {
    $ready?: Promise<void>;
  }
}
