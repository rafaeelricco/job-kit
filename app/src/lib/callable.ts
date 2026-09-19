// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `any[]` is the only constraint that matches every constructor signature
export default function Callable<T extends new (...args: any[]) => any>(classname: T) {
  function apply(target: T, _: unknown, argumentsList: ConstructorParameters<T>): InstanceType<T> {
    return new target(...argumentsList)
  }
  return new Proxy(classname, { apply }) as T & ((...args: ConstructorParameters<T>) => InstanceType<T>)
}
