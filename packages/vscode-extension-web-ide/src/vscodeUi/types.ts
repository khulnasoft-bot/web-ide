export interface InputCanceled {
  canceled: true;
}

export interface InputAccepted<T> {
  canceled: false;
  value: T;
}

export type InputResponse<T> = InputAccepted<T> | InputCanceled;
