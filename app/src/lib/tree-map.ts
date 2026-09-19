// Handle sorted-btree's inconsistent default export across ESM/CJS
import sortedBtreeModule, { type default as BTreeType } from "sorted-btree"
const BTree: typeof sortedBtreeModule = (sortedBtreeModule as any).default || sortedBtreeModule

import { type Maybe, Just, Nothing } from "./maybe"

const stringMap = <T>(): TreeMap<string, T> => TreeMap.new((x: string, y: string) => (x > y ? 1 : x < y ? -1 : 0))

interface Comparable<T> {
  compare(other: T): number
}

/**
 * Shared base for {@link TreeMap} and {@link ImmutableTreeMap}.
 *
 * Holds the BTree state, all read methods, and every bulk transformation.
 * The only thing each subclass supplies is mutation methods and a `wrap`
 * factory that lifts a fresh BTree back into its own kind.
 */
abstract class TreeMapCore<K, V> {
  // @ts-expect-error Unused field to prevent instantiation by casting.
  private readonly _: null = null
  protected tree: BTreeType<K, V>
  readonly compare: (l: K, r: K) => number

  protected constructor(tree: BTreeType<K, V>, compare: (l: K, r: K) => number) {
    this.tree = tree
    this.compare = compare
  }

  /** Construct a new instance of the same subclass around a fresh BTree. */
  protected abstract wrap<W>(tree: BTreeType<K, W>): TreeMapCore<K, W>

  get(k: K): Maybe<V> {
    const found = this.tree.get(k)
    return found !== undefined ? Just(found) : Nothing()
  }

  has(k: K): boolean {
    return this.tree.has(k)
  }

  keys(): IterableIterator<K> {
    return this.tree.keys()
  }

  values(): IterableIterator<V> {
    return this.tree.values()
  }

  entries(): IterableIterator<[K, V]> {
    return this.tree.entries()
  }

  size(): number {
    return this.tree.size
  }

  clone(): this {
    return this.wrap(this.tree.clone()) as this
  }

  /** Create a new map with keys from both maps. */
  unionWith(other: TreeMapCore<K, V>, f: (old: V, new_: V) => V): this {
    const t = this.tree.clone()
    for (const [k, v] of other.entries()) {
      const found = t.get(k)
      t.set(k, found !== undefined ? f(found, v) : v)
    }
    return this.wrap(t) as this
  }

  /**
   * Difference in the set of keys.
   * `A.difference(B)` equals A minus all keys present in B.
   */
  difference(other: TreeMapCore<K, unknown>): this {
    const t = this.tree.clone()
    for (const k of other.keys()) t.delete(k)
    return this.wrap(t) as this
  }

  /** Create a new map from keys common to two other maps. */
  intersectionWith<W, X>(other: TreeMapCore<K, W>, f: (left: V, right: W) => X): TreeMapCore<K, X> {
    const result = new BTree<K, X>([], this.compare)
    for (const [k, v] of this.entries()) {
      const found = other.tree.get(k)
      if (found !== undefined) result.set(k, f(v, found))
    }
    return this.wrap(result)
  }

  mapWithKeys<W>(f: (k: K, v: V) => W): TreeMapCore<K, W> {
    return this.wrap(this.tree.mapValues((v, k) => f(k, v)))
  }

  map<W>(f: (v: V) => W): TreeMapCore<K, W> {
    return this.mapWithKeys((_, v) => f(v))
  }
}

/**
 * A mutable Map type that requires a comparison function.
 *
 * This is just a wrapper around BTree which requires the comparison function.
 */
class TreeMap<K, V> extends TreeMapCore<K, V> {
  static new<K, V>(compare: (l: K, r: K) => number): TreeMap<K, V> {
    return new TreeMap(new BTree<K, V>([], compare), compare)
  }

  static new_<K extends Comparable<K>, V>(): TreeMap<K, V> {
    const compare = (x: K, y: K) => x.compare(y)
    return new TreeMap(new BTree<K, V>([], compare), compare)
  }

  static from<K, V>(compare: (l: K, r: K) => number, xs: Array<[K, V]>): TreeMap<K, V> {
    return TreeMap.new<K, V>(compare).setEntries(xs[Symbol.iterator]())
  }

  static from_<K extends Comparable<K>, V>(xs: Array<[K, V]>): TreeMap<K, V> {
    return TreeMap.new_<K, V>().setEntries(xs[Symbol.iterator]())
  }

  protected wrap<W>(tree: BTreeType<K, W>): TreeMap<K, W> {
    return new TreeMap(tree, this.compare)
  }

  set(k: K, v: V): this {
    this.tree.set(k, v)
    return this
  }

  setWith(k: K, v: V, f: (old: V, _new: V) => V): this {
    const found = this.tree.get(k)
    this.tree.set(k, found !== undefined ? f(found, v) : v)
    return this
  }

  remove(k: K): this {
    this.tree.delete(k)
    return this
  }

  setEntries(it: IterableIterator<[K, V]>): this {
    for (const [k, v] of it) this.tree.set(k, v)
    return this
  }
}

/**
 * An immutable Map type that requires a comparison function.
 *
 * Every update returns a new ImmutableTreeMap; the receiver is untouched.
 * Each update clones the underlying BTree before mutating the copy.
 */
class ImmutableTreeMap<K, V> extends TreeMapCore<K, V> {
  static new<K, V>(compare: (l: K, r: K) => number): ImmutableTreeMap<K, V> {
    return new ImmutableTreeMap(new BTree<K, V>([], compare), compare)
  }

  static new_<K extends Comparable<K>, V>(): ImmutableTreeMap<K, V> {
    const compare = (x: K, y: K) => x.compare(y)
    return new ImmutableTreeMap(new BTree<K, V>([], compare), compare)
  }

  static from<K, V>(compare: (l: K, r: K) => number, xs: Array<[K, V]>): ImmutableTreeMap<K, V> {
    return ImmutableTreeMap.new<K, V>(compare).setEntries(xs[Symbol.iterator]())
  }

  static from_<K extends Comparable<K>, V>(xs: Array<[K, V]>): ImmutableTreeMap<K, V> {
    return ImmutableTreeMap.new_<K, V>().setEntries(xs[Symbol.iterator]())
  }

  protected wrap<W>(tree: BTreeType<K, W>): ImmutableTreeMap<K, W> {
    return new ImmutableTreeMap(tree, this.compare)
  }

  set(k: K, v: V): ImmutableTreeMap<K, V> {
    const t = this.tree.clone()
    t.set(k, v)
    return new ImmutableTreeMap(t, this.compare)
  }

  setWith(k: K, v: V, f: (old: V, _new: V) => V): ImmutableTreeMap<K, V> {
    const t = this.tree.clone()
    const found = t.get(k)
    t.set(k, found !== undefined ? f(found, v) : v)
    return new ImmutableTreeMap(t, this.compare)
  }

  remove(k: K): ImmutableTreeMap<K, V> {
    const t = this.tree.clone()
    t.delete(k)
    return new ImmutableTreeMap(t, this.compare)
  }

  setEntries(it: IterableIterator<[K, V]>): ImmutableTreeMap<K, V> {
    const t = this.tree.clone()
    for (const [k, v] of it) t.set(k, v)
    return new ImmutableTreeMap(t, this.compare)
  }
}

export { TreeMap, ImmutableTreeMap, TreeMapCore, stringMap }
