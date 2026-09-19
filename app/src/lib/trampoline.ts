export { type Trampoline, tailRecursive, end, fix }

/**
 * A value that represents a suspended recursive computation.
 *
 * Use `tailRecursive` or `fix` to build trampolined functions that won't
 * blow the stack on deeply recursive calls. Call `.run()` to evaluate.
 */
type Trampoline<A> = End<A> | Rec<A> | Bind<A>

/**
 * Evaluate a trampoline iteratively. Pending `Bind` continuations live on an
 * explicit stack rather than the JS call stack, so mapping over a deeply
 * recursive result stays stack-safe.
 */
function run<A>(tramp: Trampoline<A>): A {
  const continuations: Array<(v: unknown) => Trampoline<unknown>> = []
  let current: Trampoline<unknown> = tramp
  for (;;) {
    if (current instanceof Bind) {
      continuations.push(current.continuation)
      current = current.inner
    } else if (current instanceof Rec) {
      current = current.fun()
    } else {
      const continuation = continuations.pop()
      if (continuation === undefined) {
        return current.value as A
      }
      current = continuation(current.value)
    }
  }
}

const rec = <A>(f: () => Trampoline<A>): Trampoline<A> => new Rec(f)

const end = <A>(v: A): Trampoline<A> => new End(v)

const bind = <A, B>(inner: Trampoline<A>, continuation: (v: A) => Trampoline<B>): Trampoline<B> =>
  new Bind<B>(inner, continuation as (v: unknown) => Trampoline<B>)

class End<A> {
  value: A
  constructor(v: A) {
    this.value = v
  }
  run(): A {
    return run(this)
  }
  map<B>(f: (v: A) => B): Trampoline<B> {
    return end(f(this.value))
  }
}

class Rec<A> {
  fun: () => Trampoline<A>
  constructor(f: () => Trampoline<A>) {
    this.fun = f
  }
  run(): A {
    return run(this)
  }
  map<B>(f: (v: A) => B): Trampoline<B> {
    return bind(this, (v) => end(f(v)))
  }
}

/**
 * A deferred transformation of another trampoline; `run` unwinds it without
 * recursion. The inner value type is erased so the union stays covariant;
 * `bind` is the only constructor and keeps the pairing type-safe.
 */
class Bind<B> {
  inner: Trampoline<unknown>
  continuation: (v: unknown) => Trampoline<B>
  constructor(inner: Trampoline<unknown>, continuation: (v: unknown) => Trampoline<B>) {
    this.inner = inner
    this.continuation = continuation
  }
  run(): B {
    return run(this)
  }
  map<C>(f: (v: B) => C): Trampoline<C> {
    return bind(this, (v) => end(f(v)))
  }
}

type Fun<A extends unknown[], B> = (...args: A) => B

function fix<A extends unknown[], R>(
  f: Fun<[Fun<A, Trampoline<R>>, (r: R) => Trampoline<R>], Fun<A, Trampoline<R>>>
): Fun<A, R> {
  let lazy_f: Fun<A, Trampoline<R>> = (..._: A) => {
    throw new Error("recursion error")
  }
  const recurse: Fun<A, Trampoline<R>> = (...args: A) => rec(() => lazy_f(...args))
  lazy_f = f(recurse, end)
  return (...args: A) => lazy_f(...args).run()
}

function tailRecursive<A extends unknown[], R>(f: Fun<A, Trampoline<R>>): Fun<A, Trampoline<R>> {
  return (...args: A) => rec(() => f(...args))
}
