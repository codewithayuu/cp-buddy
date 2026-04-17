export interface IMsgHandle<T> {
  exec(msg: T): Promise<void>;
}
